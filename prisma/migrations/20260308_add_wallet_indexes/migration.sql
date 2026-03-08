-- ✅ Critical indexes for wallet transfer optimization
-- These reduce lock contention during concurrent transfers + background deposits

-- Wallet indexes (already has user_id unique index, but adding performance indexes)
CREATE INDEX `Wallet_user_id_idx` on `Wallet`(`user_id`);
CREATE INDEX `Wallet_updated_at_idx` on `Wallet`(`updated_at`);

-- Transaction indexes for faster lookup & history queries
CREATE INDEX `Transaction_reference_id_idx` on `Transaction`(`reference_id`);
CREATE INDEX `Transaction_created_at_idx` on `Transaction`(`created_at`);

-- InternalTransfer indexes for faster history queries
CREATE INDEX `InternalTransfer_created_at_idx` on `InternalTransfer`(`created_at`);

-- ✅ These indexes help MySQL optimizer choose better execution plans
-- when multiple transactions compete for the same rows
