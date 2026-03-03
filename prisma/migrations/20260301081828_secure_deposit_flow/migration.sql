/*
  Warnings:

  - You are about to drop the column `status` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `depositsubmission` ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'DEPOSIT';

-- AlterTable
ALTER TABLE `user` DROP COLUMN `status`,
    ADD COLUMN `robot_status` VARCHAR(191) NULL DEFAULT 'INACTIVE';

-- CreateTable
CREATE TABLE `BlockchainDeposit` (
    `id` VARCHAR(191) NOT NULL,
    `tx_hash` VARCHAR(191) NOT NULL,
    `from_addr` VARCHAR(191) NOT NULL,
    `to_addr` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `confirmations` INTEGER NOT NULL,
    `is_used` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `BlockchainDeposit_tx_hash_key`(`tx_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
