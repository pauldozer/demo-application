-- ── Phase 5 migrations ─────────────────────────────────────

-- Past surgical history on patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS
  past_surgical_history TEXT[] DEFAULT '{}';

-- Billing table linked to appointments
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS appointment_billing (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id  UUID         NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    fee_type        VARCHAR(20)  NOT NULL DEFAULT 'full',
    fee_amount      DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    payment_status  VARCHAR(20)  NOT NULL DEFAULT 'pending',
    notes           TEXT,
    created_by      UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_billing_appointment UNIQUE (appointment_id)
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_billing_appointment
  ON appointment_billing (appointment_id);
