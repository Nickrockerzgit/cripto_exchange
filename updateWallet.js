import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runQuery() {
  await prisma.$executeRawUnsafe(`
    UPDATE Wallet 
    SET total_profit = profit_balance + referral_balance
  `);

  console.log("Wallet updated successfully");
}

runQuery()
  .catch(console.error)
  .finally(() => prisma.$disconnect());