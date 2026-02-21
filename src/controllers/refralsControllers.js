// src/services/referral.service.js
import { nanoid } from 'nanoid'
import * as refralService from '../services/referral.service.js'
import { PrismaClient } from '@prisma/client'
import { refreshToken } from './authControllers.js'

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

    // 5️⃣ Check rank upgrade
    await checkAndUpgradeRank(
      updatedReferrer.id,
      updatedReferrer.referral_count,
    )
  } catch (error) {
    console.log(error)
    return error
  }
}

// 🔹 Rank Upgrade Logic
// 🔹 Rank Upgrade Logic (Production Safe)
async function checkAndUpgradeRank(userId, referralCount) {
  return await prisma.$transaction(async (tx) => {
    // 1️⃣ Get user
    const user = await tx.user.findUnique({
      where: { id: userId },
    })

    if (!user) return

    // // 2️⃣ If rank locked → stop
    // if (user.rank_locked) return;

    // 3️⃣ Find highest eligible rank
    const eligibleRank = await tx.referralRank.findFirst({
      where: {
        required_referrals: { lte: referralCount },
      },
      orderBy: {
        required_referrals: 'desc',
      },
    })

    if (!eligibleRank) return

    // 4️⃣ Prevent downgrade
    if (user.referral_rank_id === eligibleRank.id) return

    // 5️⃣ Check if reward already paid
    const alreadyRewarded = await tx.referralRankHistory.findUnique({
      where: {
        user_id_rank_id: {
          user_id: userId,
          rank_id: eligibleRank.id,
        },
      },
    })

    if (alreadyRewarded) return

    // 6️⃣ Update user rankd
    await tx.user.update({
      where: { id: userId },
      data: {
        referral_rank_id: eligibleRank.id,
      },
    })

    // 7️⃣ Credit referral bonus to wallet
    await tx.wallet.updateMany({
      where: { user_id: userId },
      data: {
        referral_balance: {
          increment: eligibleRank.reward_amount,
        },
      },
    })

    // 8️⃣ Store history (prevents double reward)
    await tx.referralRankHistory.create({
      data: {
        user_id: userId,
        rank_id: eligibleRank.id,
        reward_paid: eligibleRank.reward_amount,
      },
    })
  })
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

export { handleReferralOnRegister }
