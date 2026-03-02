/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `DepositAddress` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[address]` on the table `DepositAddress` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `DepositAddress_user_id_key` ON `DepositAddress`(`user_id`);

-- CreateIndex
CREATE UNIQUE INDEX `DepositAddress_address_key` ON `DepositAddress`(`address`);
