-- AlterTable
ALTER TABLE `wallet` ADD COLUMN `total_profit` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000;

-- CreateIndex
CREATE INDEX `Wallet_user_id_idx` ON `Wallet`(`user_id`);
