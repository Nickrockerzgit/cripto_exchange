// src/services/referral.service.js
import { nanoid } from 'nanoid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🔹 Create refreal
async function createReferral(data) {
  return await prisma.referral.create({
    data
  });
}
// 🔹 Get All refrealls
async function getAllUsersRef() {
  return await prisma.referral.findMany({
    orderBy: { created_at: 'desc' }
  });
}

async function getReferralsByUserId(userId) {

  if(!userId) throw new Error("User Id is not found "); 
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallets: true,
      referralRank: false,
      referralsGiven: {
        include: {
          referred: true,
        },
        orderBy: { created_at: "desc" },
      },
    },
  });

  if (!user) throw new Error("User not found");

  // Total referred
  const totalReferred = user.referralsGiven.length;

  // Total bonus
  const totalBonus = Number ( user.wallets[0]?.referral_balance || 0);
  
  // Current rank
  const ranks = await prisma.referralRank.findUnique({
    where : {id : user.referral_rank_id}
  })
  const rank = ranks?.rank_name || "Level 1";

  // Next rank
  const nextRank = await prisma.referralRank.findFirst({
    where: {
      required_referrals: {
        gt: totalReferred,
      },
    },
    orderBy: {
      required_referrals: "asc",
    },
  });

  const nextRankTarget = nextRank?.required_referrals || null;

  // Referral link
  const referralLink = `${process.env.FRONTEND_BASE_URI}/register?ref=${user.referral_code}`;

  return {
    totalReferred,
    totalBonus,
    rank,
    nextRankTarget,
    referralLink,
    referrals: user.referralsGiven.map((ref) => ({
      id: ref.id,
      name: ref.referred.name,
      email: ref.referred.email,
      joinedDate: ref.referred.created_at,
      status: ref.activation_status ? "active" : "pending",
      bonus: 0, // you can calculate per referral if needed
    })),
  };
}

export  {
  getAllUsersRef,
  createReferral,
  getReferralsByUserId
};
