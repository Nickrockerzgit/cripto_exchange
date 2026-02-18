/*
  Warnings:

  - A unique constraint covering the columns `[referred_user_id]` on the table `Referral` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[referral_code]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `activation_status` on table `referral` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bonus_credited` on table `referral` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `referral` MODIFY `activation_status` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `bonus_credited` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `referral_count` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX `Referral_referred_user_id_key` ON `Referral`(`referred_user_id`);

-- CreateIndex
CREATE UNIQUE INDEX `User_referral_code_key` ON `User`(`referral_code`);

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referrer_id_fkey` FOREIGN KEY (`referrer_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referred_user_id_fkey` FOREIGN KEY (`referred_user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
