@echo off
:: ═══════════════════════════════════════════════════════════
:: Clinic EHR — Restore Script (Windows)
:: Run this to recover from a backup after data loss
:: ═══════════════════════════════════════════════════════════

setlocal

:: ── Configuration (must match backup.bat) ──────────────────
set DB_NAME=clinic_ehr
set DB_USER=clinic_app
set DB_PASSWORD=ChangeThisPassword123!
set DATA_DIR=C:\clinic-ehr\server\data
set BACKUP_DIR=%DATA_DIR%\backups
set PGBIN=C:\Program Files\PostgreSQL\16\bin

:: ── List available backups ──────────────────────────────────
echo Available database backups:
echo.
dir /B "%BACKUP_DIR%\db\*.sql" 2>nul || echo No backups found!
echo.

:: ── Ask which backup to restore ────────────────────────────
set /P BACKUP_FILE=Enter backup filename (e.g. clinic_2025-01-15.sql):
set FULL_PATH=%BACKUP_DIR%\db\%BACKUP_FILE%

if not exist "%FULL_PATH%" (
  echo ERROR: File not found: %FULL_PATH%
  exit /b 1
)

echo.
echo WARNING: This will REPLACE all current data in %DB_NAME%.
set /P CONFIRM=Type YES to continue:
if /I not "%CONFIRM%"=="YES" (
  echo Restore cancelled.
  exit /b 0
)

:: ── Stop the Node.js server ─────────────────────────────────
echo Stopping Clinic EHR server...
pm2 stop clinic-ehr 2>nul || echo (server was not running)

:: ── Restore database ────────────────────────────────────────
echo Restoring database from %BACKUP_FILE%...
set PGPASSWORD=%DB_PASSWORD%

:: Drop and recreate the database
"%PGBIN%\psql" -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='%DB_NAME%';" 2>nul
"%PGBIN%\psql" -U postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;"
"%PGBIN%\psql" -U postgres -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;"

:: Restore from backup
"%PGBIN%\psql" -U %DB_USER% -h localhost -d %DB_NAME% < "%FULL_PATH%"
if %errorlevel% neq 0 (
  echo ERROR: Database restore failed!
  exit /b 1
)
echo Database restored successfully.

:: ── Restore patient files ────────────────────────────────────
echo Restoring patient files...
if exist "%BACKUP_DIR%\files\latest" (
  robocopy "%BACKUP_DIR%\files\latest" "%DATA_DIR%\patients" /MIR /NFL /NDL /NJH /NJS
  echo Patient files restored.
) else (
  echo No file backup found — skipping file restore.
)

:: ── Restart server ───────────────────────────────────────────
echo Restarting Clinic EHR server...
cd /D C:\clinic-ehr\server
pm2 start ecosystem.config.js
echo.
echo Restore complete. Open http://clinic.local in browser to verify.
endlocal
