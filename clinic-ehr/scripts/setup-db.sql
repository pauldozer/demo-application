-- ═══════════════════════════════════════════════════════════
-- Clinic EHR — First-time PostgreSQL setup
-- Run as a PostgreSQL superuser (e.g. postgres)
--
-- psql -U postgres -f scripts/setup-db.sql
-- ═══════════════════════════════════════════════════════════

-- 1. Create the application database user
--    Change the password below before running!
CREATE USER clinic_app WITH PASSWORD 'ChangeThisPassword123!';

-- 2. Create the database
CREATE DATABASE clinic_ehr OWNER clinic_app ENCODING 'UTF8';

-- 3. Grant privileges
GRANT ALL PRIVILEGES ON DATABASE clinic_ehr TO clinic_app;

-- 4. Connect to the new database and set schema permissions
\c clinic_ehr

GRANT ALL ON SCHEMA public TO clinic_app;

-- Done. Now run: npm run dev (in /server) to apply migrations.
