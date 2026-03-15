-- AlterTable
ALTER TABLE `user` ADD COLUMN `isExpired` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `robot_activation_timestamp` DATETIME(3) NULL;
