// prisma/seed.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ============================
  // ROLES
  // ============================
  await prisma.role.upsert({
    where: { role_name: "USER" },
    update: {},
    create: { role_name: "USER" },
  });

  await prisma.role.upsert({
    where: { role_name: "ADMIN" },
    update: {},
    create: { role_name: "ADMIN" },
  });

  // ============================
  // REFERRAL RANKS
  // ============================

  const referralRanks = [
    { rank_name: "Level 1", required_referrals: 10, reward_amount: 100 },
    { rank_name: "Level 2", required_referrals: 50, reward_amount: 500 },
    { rank_name: "Level 3", required_referrals: 100, reward_amount: 1000 },
    { rank_name: "Level 4", required_referrals: 250, reward_amount: 1500 },
    { rank_name: "Level 5", required_referrals: 500, reward_amount: 2000 },
    { rank_name: "Level 6", required_referrals: 1000, reward_amount: 2500 },
    { rank_name: "Level 7", required_referrals: 2000, reward_amount: 3000 },
    { rank_name: "Level 8", required_referrals: 3000, reward_amount: 4000 },
    { rank_name: "Level 9", required_referrals: 4000, reward_amount: 5000 },
    { rank_name: "Level 10", required_referrals: 5000, reward_amount: 7000 },
  ];

  for (const rank of referralRanks) {
    await prisma.referralRank.upsert({
      where: { rank_name: rank.rank_name },
      update: {},
      create: rank,
    });
  }

  // ============================
  // INVESTMENT PLANS
  // ============================

  await prisma.investmentPlan.upsert({
    where: { name: "Diamond Membership" },
    update: {},
    create: {
      name: "Diamond Membership",
      min_amount: 100,
      max_amount: 999,
      min_interest: 5,
      max_interest: 5,
    },
  });

  await prisma.investmentPlan.upsert({
    where: { name: "Platinum Membership" },
    update: {},
    create: {
      name: "Platinum Membership",
      min_amount: 1000,
      max_amount: null,
      min_interest: 7,
      max_interest: 12,
    },
  });

  console.log("✅ Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });