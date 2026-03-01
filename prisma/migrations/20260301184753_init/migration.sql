/*
  Warnings:

  - Added the required column `remaining_principal` to the `Investment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `investment` ADD COLUMN `remaining_principal` DECIMAL(65, 30) NOT NULL;
