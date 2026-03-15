
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`User\` 
      ADD COLUMN IF NOT EXISTS \`robot_activation_timestamp\` DATETIME(3) NULL,
      ADD COLUMN IF NOT EXISTS \`isExpired\` BOOLEAN NOT NULL DEFAULT FALSE
    `);
    console.log('✅ Columns added successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();