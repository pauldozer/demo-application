-- ═══════════════════════════════════════════════════════
-- Clinic EHR — Initial Schema
-- Migration 001
-- ═══════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── ENUM Types ────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'assistant');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'scheduled', 'confirmed', 'arrived', 'in_progress',
    'completed', 'cancelled', 'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE file_type AS ENUM ('lab', 'imaging', 'report', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE consult_status AS ENUM ('draft', 'complete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── USERS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100)  NOT NULL,
  username      VARCHAR(50)   NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  role          user_role     NOT NULL DEFAULT 'assistant',
  is_active     BOOLEAN       NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_users_username UNIQUE (username)
);

-- ─── PATIENT NUMBER SEQUENCE ───────────────────────────
CREATE SEQUENCE IF NOT EXISTS patient_number_seq START 1 INCREMENT 1;

-- ─── PATIENTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id                   UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_number       VARCHAR(20)  NOT NULL,
  full_name            VARCHAR(200) NOT NULL,
  full_name_en         VARCHAR(200),
  dob                  DATE,
  gender               gender_type,
  phone                VARCHAR(30),
  phone_alt            VARCHAR(30),
  address              TEXT,
  blood_type           VARCHAR(5),
  allergies            TEXT[]       NOT NULL DEFAULT '{}',
  chronic_conditions   TEXT[]       NOT NULL DEFAULT '{}',
  notes                TEXT,
  created_by           UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_patients_number UNIQUE (patient_number)
);

-- Patient search indexes (supports Arabic and English, plus trigram for partials)
CREATE INDEX IF NOT EXISTS idx_patients_name_fts
  ON patients USING GIN (to_tsvector('simple', full_name));

CREATE INDEX IF NOT EXISTS idx_patients_name_en_fts
  ON patients USING GIN (to_tsvector('simple', coalesce(full_name_en, '')));

CREATE INDEX IF NOT EXISTS idx_patients_name_trgm
  ON patients USING GIN (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_patients_number
  ON patients (patient_number);

CREATE INDEX IF NOT EXISTS idx_patients_phone
  ON patients (phone);

CREATE INDEX IF NOT EXISTS idx_patients_created
  ON patients (created_at DESC);

-- ─── CONSULTATIONS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultations (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id       UUID         NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id        UUID         NOT NULL REFERENCES users(id),
  visit_date       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  chief_complaint  TEXT,
  subjective       TEXT,
  objective        TEXT,
  assessment       TEXT,
  plan             TEXT,
  follow_up_date   DATE,
  follow_up_notes  TEXT,
  status           consult_status NOT NULL DEFAULT 'draft',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultations_patient
  ON consultations (patient_id, visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_consultations_doctor
  ON consultations (doctor_id, visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_consultations_followup
  ON consultations (follow_up_date) WHERE follow_up_date IS NOT NULL;

-- ─── VITALS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vitals (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id   UUID         NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  weight_kg         DECIMAL(5,2),
  height_cm         DECIMAL(5,1),
  bmi               DECIMAL(4,2),
  bp_systolic       SMALLINT,
  bp_diastolic      SMALLINT,
  pulse_bpm         SMALLINT,
  temp_celsius      DECIMAL(4,1),
  o2_sat_pct        SMALLINT,
  recorded_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vitals_consultation
  ON vitals (consultation_id);

-- ─── MEDICATIONS (shared library) ──────────────────────
CREATE TABLE IF NOT EXISTS medications (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(200) NOT NULL,
  generic_name VARCHAR(200),
  form         VARCHAR(50),
  strength     VARCHAR(50),
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medications_name_trgm
  ON medications USING GIN (name gin_trgm_ops);

-- ─── PRESCRIPTIONS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id  UUID         REFERENCES consultations(id) ON DELETE SET NULL,
  patient_id       UUID         NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id        UUID         NOT NULL REFERENCES users(id),
  medication_id    UUID         REFERENCES medications(id) ON DELETE SET NULL,
  medication_name  VARCHAR(200) NOT NULL,
  dosage           VARCHAR(100),
  frequency        VARCHAR(100),
  duration         VARCHAR(100),
  instructions     TEXT,
  is_current       BOOLEAN      NOT NULL DEFAULT true,
  prescribed_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  stopped_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient
  ON prescriptions (patient_id, is_current, prescribed_at DESC);

CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation
  ON prescriptions (consultation_id);

-- ─── PATIENT FILES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_files (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id       UUID         NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  consultation_id  UUID         REFERENCES consultations(id) ON DELETE SET NULL,
  uploaded_by      UUID         NOT NULL REFERENCES users(id),
  file_type        file_type    NOT NULL DEFAULT 'other',
  category         VARCHAR(100),
  original_name    VARCHAR(255) NOT NULL,
  storage_path     VARCHAR(500) NOT NULL,
  file_size_bytes  BIGINT,
  mime_type        VARCHAR(100),
  description      TEXT,
  uploaded_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_patient
  ON patient_files (patient_id, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_files_consultation
  ON patient_files (consultation_id) WHERE consultation_id IS NOT NULL;

-- ─── APPOINTMENTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id             UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id     UUID               NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id      UUID               NOT NULL REFERENCES users(id),
  scheduled_at   TIMESTAMPTZ        NOT NULL,
  duration_mins  SMALLINT           NOT NULL DEFAULT 20,
  type           VARCHAR(100),
  status         appointment_status NOT NULL DEFAULT 'scheduled',
  check_in_time  TIMESTAMPTZ,
  notes          TEXT,
  created_by     UUID               REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- Prevent double-booking (active appointments only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_book
  ON appointments (doctor_id, scheduled_at)
  WHERE status NOT IN ('cancelled', 'no_show');

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
  ON appointments (doctor_id, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_appointments_patient
  ON appointments (patient_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_date_status
  ON appointments (scheduled_at, status);

-- ─── AUDIT LOGS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id           BIGSERIAL    PRIMARY KEY,
  user_id      UUID         REFERENCES users(id) ON DELETE SET NULL,
  action       VARCHAR(100) NOT NULL,
  entity_type  VARCHAR(50),
  entity_id    UUID,
  old_values   JSONB,
  new_values   JSONB,
  ip_address   VARCHAR(45),
  user_agent   TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity
  ON audit_logs (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_user
  ON audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_created
  ON audit_logs (created_at DESC);

-- ─── REFRESH TOKENS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(64) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ,
  CONSTRAINT uq_refresh_token UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user
  ON refresh_tokens (user_id);
