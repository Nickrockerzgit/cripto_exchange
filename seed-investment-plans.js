// Example Investment Plan Seeding
// Add this to your prisma/seed.js file

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedInvestmentPlans() {
  console.log('🌱 Seeding investment plans...');

  // Create investment plans
  const plans = await prisma.investmentPlan.createMany({
    data: [
      {
        name: 'Basic Plan',
        min_amount: 1,
        max_amount: 10000,
        min_interest: 7,
        max_interest: 7
      },
      {
        name: 'Standard Plan',
        min_amount: 10001,
        max_amount: 25000,
        min_interest: 8,
        max_interest: 8
      },
      {
        name: 'Premium Plan',
        min_amount: 25001,
        max_amount: null, // No upper limit
        min_interest: 9,
        max_interest: 9
      }
    ],
    skipDuplicates: true
  });

  console.log(`✅ Created ${plans.count} investment plans`);

  // Display created plans
  const allPlans = await prisma.investmentPlan.findMany({
    orderBy: { min_amount: 'asc' }
  });

  console.log('\n📊 Investment Plans:');
  allPlans.forEach(plan => {
    const maxDisplay = plan.max_amount ? `$${plan.max_amount}` : 'No Limit';
    console.log(`  • ${plan.name}: $${plan.min_amount} - ${maxDisplay} → ${plan.min_interest}% monthly`);
  });
}

// Run seeding
async function main() {
  try {
    await seedInvestmentPlans();
    console.log('\n✅ Investment plan seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
