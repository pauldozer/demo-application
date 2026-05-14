-- Commission percentage per user (primarily for doctors)
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  commission_pct DECIMAL(5,2) NOT NULL DEFAULT 0
  CHECK (commission_pct >= 0 AND commission_pct <= 100);
