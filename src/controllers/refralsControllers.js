
// src/services/referral.service.js
import { nanoid } from 'nanoid';
import * as refralService from '../services/referral.service.js';


// 🔹 Generate referral code
function generateReferralCode() {
  return nanoid(8).toUpperCase();
}

// 🔹 Generate referral URL
function generateReferralUrl(code) {
  return `${process.env.FRONTEND_URL}/register?ref=${code}`;
}

// 🔹 Create referral entry (if ref param exists)
async function handleReferralOnRegister(referralCode, newUserId) {
  if (!referralCode) return;

  // 1️⃣ Find referrer
  const referrer = await prisma.referral.findUnique({
    where: { referral_code: referralCode }
  });

  if (!referrer) return; // invalid code → ignore silently

  // 2️⃣ Prevent self-referral (extra protection)
  if (referrer.id === newUserId) return;

  // 3️⃣ Create referral entry
  await refralService.createReferral({
    data: {
      referrer_id: referrer.id,
      referred_user_id: newUserId
    }
  });

  // 4️⃣ Increase referral count
  const updatedReferrer = await prisma.user.update({
    where: { id: referrer.id },
    data: {
      referral_count: { increment: 1 }
    }
  });

  // 5️⃣ Check rank upgrade
  await checkAndUpgradeRank(updatedReferrer.id, updatedReferrer.referral_count);
}

// 🔹 Rank Upgrade Logic
// 🔹 Rank Upgrade Logic (Production Safe)
async function checkAndUpgradeRank(userId, referralCount) {
  return await prisma.$transaction(async (tx) => {

    // 1️⃣ Get user
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        referral_rank_id: true,
        rank_locked: true
      }
    });

    if (!user) return;

    // 2️⃣ If rank locked → stop
    if (user.rank_locked) return;

    // 3️⃣ Find highest eligible rank
    const eligibleRank = await tx.referralRank.findFirst({
      where: {
        required_referrals: { lte: referralCount }
      },
      orderBy: {
        required_referrals: "desc"
      }
    });

    if (!eligibleRank) return;

    // 4️⃣ Prevent downgrade
    if (user.referral_rank_id === eligibleRank.id) return;

    // 5️⃣ Check if reward already paid
    const alreadyRewarded = await tx.referralRankHistory.findUnique({
      where: {
        user_id_rank_id: {
          user_id: userId,
          rank_id: eligibleRank.id
        }
      }
    });

    if (alreadyRewarded) return;

    // 6️⃣ Update user rankd
    await tx.user.update({
      where: { id: userId },
      data: {
        referral_rank_id: eligibleRank.id
      }
    });

    // 7️⃣ Credit referral bonus to wallet
    await tx.wallet.updateMany({
      where: { user_id: userId },
      data: {
        referral_balance: {
          increment: eligibleRank.reward_amount
        }
      }
    });

    // 8️⃣ Store history (prevents double reward)
    await tx.referralRankHistory.create({
      data: {
        user_id: userId,
        rank_id: eligibleRank.id,
        reward_paid: eligibleRank.reward_amount
      }
    });

  });
}



export const getAllUsersRefrals = async (req, res) => {
  try {
    const users = await refralService.getAllUsersRef();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
    handleReferralOnRegister
}