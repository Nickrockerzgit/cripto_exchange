-- AlterTable
ALTER TABLE `internaltransfer` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'SUCCESS';
