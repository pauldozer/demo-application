-- Default consultation fee per doctor (set by admin, used to pre-fill billing)
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  default_fee DECIMAL(10,2);
