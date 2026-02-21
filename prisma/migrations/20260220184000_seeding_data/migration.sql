/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `InvestmentPlan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rank_name]` on the table `InvestmentRank` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rank_name]` on the table `ReferralRank` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[role_name]` on the table `Role` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `InvestmentPlan_name_key` ON `InvestmentPlan`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `InvestmentRank_rank_name_key` ON `InvestmentRank`(`rank_name`);

-- CreateIndex
CREATE UNIQUE INDEX `ReferralRank_rank_name_key` ON `ReferralRank`(`rank_name`);

-- CreateIndex
CREATE UNIQUE INDEX `Role_role_name_key` ON `Role`(`role_name`);
