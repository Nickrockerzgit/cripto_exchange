import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllTransactionsForAdmin = async (req, res) => {
  try {
    // pagination and optional filters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type;      // optional ("all" means no filter)
    const status = req.query.status;  // optional ("all" means no filter)

    const skip = (page - 1) * limit;

    // ignore filters when user passes 'all' or empty string
    const where = {};
    if (type && type !== 'all') {
      where.type = type;
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    const formattedTransactions = transactions.map((txn) => ({
      id: txn.id,
      user_id: txn.user_id,
      user_name: txn.user?.name || null,
      user_email: txn.user?.email || null,
      type: txn.type,
      amount: Number(txn.gross_amount || 0),
      fee: Number(txn.fee_amount || 0),
      penalty: Number(txn.penalty_amount || 0),
      netAmount: Number(txn.net_amount || 0),
      status: txn.status,
      referenceId: txn.reference_id,
      sourceWallet: txn.source_wallet,
      destinationWallet: txn.destination_wallet,
      description: txn.description,
      timestamp: txn.created_at,
    }));

    return res.json({
      success: true,
      data: formattedTransactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin transaction history error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
