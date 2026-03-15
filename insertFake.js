import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.blockchainDeposit.create({
    data: {
      tx_hash: 'testtxhash123',
      from_addr: 'TFakeAddr',
      to_addr: 'TRRBEAZp1UhHd3W5sKHfpWjxk77WjargVg',
      amount: 30,
      confirmations: 6,
      is_used: false,
    }
  });
  console.log('✅ Fake TX inserted:', result);
  await prisma.$disconnect();
}

main().catch(console.error);