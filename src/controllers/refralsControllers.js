// src/services/referral.service.js
import { nanoid } from 'nanoid'
import * as refralService from '../services/referral.service.js'
import { PrismaClient } from '@prisma/client'
import { refreshToken } from './authControllers.js'
import { successResponse } from '../utils/successResponse.js'

const prisma = new PrismaClient()

// 🔹 Create referral entry (if ref param exists)
async function handleReferralOnRegister(referralCode, newUserId) {
  if (!referralCode) return
  console.log(referralCode)
  try {
    // 1️⃣ Find referrer
    const referrer = await prisma.user.findUnique({
      where: { referral_code: referralCode },
    })
    console.log(JSON.stringify(referrer))
    if (!referrer) return // invalid code → ignore silently

    // 2️ Prevent self-referral (extra protection)
    if (referrer.id === newUserId) return

    // 3️ Create referral entry
    await refralService.createReferral({
      referrer_id: referrer.id,
      referred_user_id: newUserId,
    })
    referrer.referral_count = referrer.referral_count + 1
    // 4️ Increase referral count
    const updatedReferrer = await prisma.user.update({
      where: { id: referrer.id },
      data: {
        referral_count: referrer.referral_count,
      },
    })

    // 5️ Check rank upgrade
  } catch (error) {
    console.log(error)
    return error
  }
}

async function checkAndUpgradeRank(userId) {
  if (!userId) return

  // 1️ Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      referral_count: true,
      referral_rank_id: true,
    },
  })

  if (!user) return

  // 2️ Get current rank
  const currentRank = await prisma.referralRank.findUnique({
    where: { id: user.referral_rank_id },
  })

  if (!currentRank) return

  // 3️ Count active referrals
  const activeReferralsCount = await prisma.referral.count({
    where: {
      referrer_id: userId,
      activation_status: true
    }
  });

  // ===============================
  // 🔹 STEP 1: ASSIGN NEXT LEVEL
  // ===============================

  // If user completed current level requirement
  if (activeReferralsCount >= currentRank.required_referrals) {
    // Get next level
    const nextRank = await prisma.referralRank.findFirst({
      where: {
        required_referrals: {
          gt: currentRank.required_referrals,
        },
      },
      orderBy: {
        required_referrals: 'asc',
      },
    })

    if (nextRank) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          referral_rank_id: nextRank.id,
        },
      })
    }
  }

  // ===============================
  //  STEP 2: REWARD LOGIC
  // ===============================
  // Reward only when user completes THIS level requirement
  if (activeReferralsCount >= currentRank.required_referrals) {
    const alreadyRewarded = await prisma.referralRankHistory.findUnique({
      where: {
        user_id_rank_id: {
          user_id: userId,
          rank_id: currentRank.id,
        },
      },
    })

    if (!alreadyRewarded) {
      // Reward wallet
      await prisma.wallet.update({
        where: { user_id: userId },
        data: {
          referral_balance: {
            increment: currentRank.reward_amount,
          },
          total_profit: {
            increment: currentRank.reward_amount,
          },
        },
      })

      // Save reward history
      await prisma.referralRankHistory.create({
        data: {
          user_id: userId,
          rank_id: currentRank.id,
          reward_paid: currentRank.reward_amount,
        },
      })
    }
  }


  return { success: true }
}
export const getAllRefralsByUserId = async (req, res) => {
  try {
    // const userId = req.user.id; // if using auth middleware
    const { id } = req.params
    console.log(id)
    if (!id) {
      return res.status(400).json({ message: 'User Id is required' })
    }
    const data = await refralService.getReferralsByUserId(id)
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAllUsersRefrals = async (req, res) => {
  try {
    const users = await refralService.getAllUsersRef()
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export { handleReferralOnRegister, checkAndUpgradeRank }
