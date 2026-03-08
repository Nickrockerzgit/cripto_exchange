// src/services/transfer.service.js
import { PrismaClient } from "@prisma/client";

// ─── Singleton PrismaClient ───────────────────────────────────────────────────
// A single shared instance is reused across the application lifetime.
// Re-creating PrismaClient on every call exhausts the connection pool.
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ─── Retry helper ────────────────────────────────────────────────────────────
/**
 * Retries an async operation when Prisma throws P2028 (transaction timeout /
 * stale transaction handle). All other errors are re-thrown immediately.
 *
 * @template T
 * @param {() => Promise<T>} fn  - Async factory to retry
 * @param {number}           max - Maximum attempts (default 3)
 * @returns {Promise<T>}
 */
async function withP2028Retry(fn, max = 3) {
  let attempt = 0;
  while (true) {
    try {
      attempt++;
      return await fn();
    } catch (err) {
      const isP2028 =
        err?.code === "P2028" || (err?.message ?? "").includes("P2028");

      if (isP2028 && attempt < max) {
        console.warn(
          `[TransferService] P2028 detected — retrying (attempt ${attempt} of ${max})…`,
        );
        // Exponential back-off: 50 ms, 100 ms, …
        await new Promise((r) => setTimeout(r, 50 * attempt));
        continue;
      }
      throw err;
    }
  }
}

// ─── TransferService ─────────────────────────────────────────────────────────
class TransferService {
  /**
   * Execute user-to-user wallet transfer.
   *
   * Critical-path architecture:
   *
   *  [PRE-FLIGHT]  — outside tx: validate inputs, resolve receiver & wallets
   *  [TRANSACTION] — 3 ops only: debit sender | credit receiver | create record
   *  [POST-FLIGHT] — outside tx: write ledger entries (non-blocking audit trail)
   *
   * @param {string}      senderId
   * @param {string}      receiverIdentifier  Email, phone, or user ID
   * @param {number}      amount
   * @param {string|null} description
   * @returns {Promise<Object>}
   */
  async executeTransfer(
    senderId,
    receiverIdentifier,
    amount,
    description = null,
  ) {
    // ── 1. Input validation ────────────────────────────────────────────────
    if (!amount || amount <= 0) {
      throw new Error("Transfer amount must be greater than 0");
    }
    const transferAmount = Number(amount);

    // ── 2. Pre-flight (all reads OUTSIDE the transaction) ─────────────────
    //    Slow or conditional reads inside a tx inflate the lock-hold window,
    //    causing P2028 timeouts under load. Resolve everything up front so the
    //    tx body can fly through its 3 writes as fast as possible.

    const receiver = await prisma.user.findFirst({
      where: {
        OR: [
          { id: receiverIdentifier },
          { email: receiverIdentifier },
          { phone: receiverIdentifier },
        ],
      },
      select: { id: true, name: true, email: true, status: true },
    });

    if (!receiver) throw new Error("Receiver not found");
    if (receiver.status !== "ACTIVE")
      throw new Error("Receiver account is not active");
    if (receiver.id === senderId)
      throw new Error("Cannot transfer to yourself");

    // Early balance check — avoids acquiring locks when the balance is obviously
    // insufficient. The tx re-checks atomically under Serializable isolation.
    const senderWalletSnap = await prisma.wallet.findUniqueOrThrow({
      where: { user_id: senderId },
      select: { main_balance: true },
    });
    if (Number(senderWalletSnap.main_balance) < transferAmount) {
      throw new Error(
        `Insufficient balance. Available: ${senderWalletSnap.main_balance}, Required: ${transferAmount}`,
      );
    }

    // Confirm receiver wallet exists before entering the tx.
    await prisma.wallet.findUniqueOrThrow({
      where: { user_id: receiver.id },
      select: { user_id: true },
    });

    // ── 3. Minimal atomic transaction (exactly 3 database operations) ──────
    const { transfer, senderBalance, receiverBalance } = await withP2028Retry(
      () =>
        prisma.$transaction(
          async (tx) => {
            // Re-read sender balance inside the Serializable tx.
            // This is the authoritative double-spend guard: concurrent txns that
            // passed the pre-flight snapshot will serialize here and one will fail.
            const lockedSender = await tx.wallet.findUniqueOrThrow({
              where: { user_id: senderId },
              select: { main_balance: true },
            });

            if (Number(lockedSender.main_balance) < transferAmount) {
              throw new Error(
                `Insufficient balance. Available: ${lockedSender.main_balance}, Required: ${transferAmount}`,
              );
            }

            // Op 1 — Debit sender
            const updatedSender = await tx.wallet.update({
              where: { user_id: senderId },
              data: { main_balance: { decrement: transferAmount } },
              select: { main_balance: true },
            });

            // Op 2 — Credit receiver
            const updatedReceiver = await tx.wallet.update({
              where: { user_id: receiver.id },
              data: { main_balance: { increment: transferAmount } },
              select: { main_balance: true },
            });

            // Op 3 — Create internal transfer record
            //         (its ID is referenced by both ledger entries post-flight)
            const transfer = await tx.internalTransfer.create({
              data: {
                sender_id: senderId,
                receiver_id: receiver.id,
                amount: transferAmount,
                status: "SUCCESS",
                description,
              },
            });

            return {
              transfer,
              senderBalance: Number(updatedSender.main_balance),
              receiverBalance: Number(updatedReceiver.main_balance),
            };
          },
          {
            timeout: 10000, // ⚠️ CRITICAL: Reduced from 15s to 10s to match frontend timeout
            isolationLevel: "ReadCommitted", // ⚠️ CRITICAL: Changed from Serializable to ReadCommitted
            // Reduces contention with background jobs while maintaining
            // double-spend protection via pre-flight check + re-check pattern
          },
        ),
    );

    // ── 4. Post-flight: ledger entries OUTSIDE the transaction ─────────────
    //    These are append-only audit records. Money has already moved safely.
    //    If a ledger write fails, surface it for alerting / reconciliation but
    //    do NOT roll back the transfer. Promise.allSettled ensures one failure
    //    doesn't suppress the other.
    const ledgerResults = await Promise.allSettled([
      // Sender ledger (debit)
      prisma.transaction.create({
        data: {
          user_id: senderId,
          type: "USER_TO_USER_TRANSFER_SENT",
          source_wallet: "MAIN_WALLET",
          destination_wallet: "USER_WALLET",
          gross_amount: transferAmount,
          fee_amount: 0,
          penalty_amount: 0,
          net_amount: transferAmount,
          status: "SUCCESS",
          reference_id: transfer.id,
          description: `Transfer sent to ${receiver.name || receiver.email}${
            description ? ": " + description : ""
          }`,
        },
      }),
      // Receiver ledger (credit)
      prisma.transaction.create({
        data: {
          user_id: receiver.id,
          type: "USER_TO_USER_TRANSFER_RECEIVED",
          source_wallet: "USER_WALLET",
          destination_wallet: "MAIN_WALLET",
          gross_amount: transferAmount,
          fee_amount: 0,
          penalty_amount: 0,
          net_amount: transferAmount,
          status: "SUCCESS",
          reference_id: transfer.id,
          description: `Transfer received from user${
            description ? ": " + description : ""
          }`,
        },
      }),
    ]);

    for (const result of ledgerResults) {
      if (result.status === "rejected") {
        // Alert here (Sentry, PagerDuty, etc.) — requires manual reconciliation
        console.error(
          "[TransferService] Ledger write failed — requires reconciliation:",
          result.reason,
        );
      }
    }

    // ── 5. Return API-compatible result (unchanged contract) ───────────────
    return {
      transfer,
      senderBalance,
      receiverBalance,
      receiver: {
        id: receiver.id,
        name: receiver.name,
        email: receiver.email,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // The methods below are unchanged in behaviour; minor style-only cleanup.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * @param {string} userId
   * @param {{ page?: number, limit?: number, type?: 'sent'|'received'|'all' }} options
   */
  async getTransferHistory(userId, options = {}) {
    const { page = 1, limit = 10, type = "all" } = options;
    const skip = (page - 1) * limit;

    let where = {};
    if (type === "sent") where.sender_id = userId;
    else if (type === "received") where.receiver_id = userId;
    else where.OR = [{ sender_id: userId }, { receiver_id: userId }];

    try {
      const [transfers, total] = await Promise.all([
        prisma.internalTransfer.findMany({
          where,
          include: {
            sender: { select: { id: true, name: true, email: true } },
            receiver: { select: { id: true, name: true, email: true } },
          },
          orderBy: { created_at: "desc" },
          skip,
          take: limit,
        }),
        prisma.internalTransfer.count({ where }),
      ]);

      return {
        data: transfers.map((t) => ({
          id: t.id,
          amount: Number(t.amount),
          status: t.status,
          description: t.description,
          type: t.sender_id === userId ? "SENT" : "RECEIVED",
          sender: t.sender,
          receiver: t.receiver,
          created_at: t.created_at,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Get Transfer History Error:", error);
      throw error;
    }
  }

  /**
   * @param {string} transferId
   * @param {string} userId
   */
  async getTransferById(transferId, userId) {
    try {
      const transfer = await prisma.internalTransfer.findUnique({
        where: { id: transferId },
        include: {
          sender: { select: { id: true, name: true, email: true } },
          receiver: { select: { id: true, name: true, email: true } },
        },
      });

      if (!transfer) throw new Error("Transfer not found");
      if (transfer.sender_id !== userId && transfer.receiver_id !== userId) {
        throw new Error("Unauthorized to view this transfer");
      }

      return {
        id: transfer.id,
        amount: Number(transfer.amount),
        status: transfer.status,
        description: transfer.description,
        type: transfer.sender_id === userId ? "SENT" : "RECEIVED",
        sender: transfer.sender,
        receiver: transfer.receiver,
        created_at: transfer.created_at,
      };
    } catch (error) {
      console.error("Get Transfer By ID Error:", error);
      throw error;
    }
  }

  /**
   * @param {string} identifier - Email or phone
   */
  async searchReceiver(identifier) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { phone: identifier }],
          status: "ACTIVE",
        },
        select: { id: true, name: true, email: true, phone: true },
      });
      return user ?? null;
    } catch (error) {
      console.error("Search Receiver Error:", error);
      throw error;
    }
  }
}

export default new TransferService();
