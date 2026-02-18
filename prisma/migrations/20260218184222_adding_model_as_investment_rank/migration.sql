/*
  Warnings:

  - Made the column `rank_name` on table `referralrank` required. This step will fail if there are existing NULL values in that column.
  - Made the column `required_referrals` on table `referralrank` required. This step will fail if there are existing NULL values in that column.
  - Made the column `reward_amount` on table `referralrank` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `userrank` DROP FOREIGN KEY `UserRank_rank_id_fkey`;

-- DropIndex
DROP INDEX `UserRank_rank_id_fkey` ON `userrank`;

-- AlterTable
ALTER TABLE `referralrank` MODIFY `rank_name` VARCHAR(191) NOT NULL,
    MODIFY `required_referrals` INTEGER NOT NULL,
    MODIFY `reward_amount` DECIMAL(65, 30) NOT NULL;

-- CreateTable
CREATE TABLE `InvestmentRank` (
    `id` VARCHAR(191) NOT NULL,
    `rank_name` VARCHAR(191) NOT NULL,
    `required_investment` DECIMAL(65, 30) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReferralRankHistory` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `rank_id` VARCHAR(191) NOT NULL,
    `reward_paid` DECIMAL(65, 30) NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ReferralRankHistory_user_id_rank_id_key`(`user_id`, `rank_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_referral_rank_id_fkey` FOREIGN KEY (`referral_rank_id`) REFERENCES `ReferralRank`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReferralRankHistory` ADD CONSTRAINT `ReferralRankHistory_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReferralRankHistory` ADD CONSTRAINT `ReferralRankHistory_rank_id_fkey` FOREIGN KEY (`rank_id`) REFERENCES `ReferralRank`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRank` ADD CONSTRAINT `UserRank_rank_id_fkey` FOREIGN KEY (`rank_id`) REFERENCES `InvestmentRank`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
