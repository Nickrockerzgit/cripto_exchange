/*
  Warnings:

  - A unique constraint covering the columns `[depositAddress]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Admin` ADD COLUMN `depositAddress` VARCHAR(191) NOT NULL DEFAULT 'TRRBEAZp1UhHd3W5sKHfpWjxk77WjargVg';

-- CreateIndex
CREATE UNIQUE INDEX `Admin_depositAddress_key` ON `Admin`(`depositAddress`);
