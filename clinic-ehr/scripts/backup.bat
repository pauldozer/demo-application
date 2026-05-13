@echo off
:: ═══════════════════════════════════════════════════════════
:: Clinic EHR — Automated Backup Script (Windows)
:: Schedule via Task Scheduler to run daily at 2:00 AM
:: ═══════════════════════════════════════════════════════════

setlocal

:: ── Configuration ──────────────────────────────────────────
set DB_NAME=clinic_ehr
set DB_USER=clinic_app
set DB_PASSWORD=ChangeThisPassword123!
set DATA_DIR=C:\clinic-ehr\server\data
set BACKUP_DIR=%DATA_DIR%\backups
set PGBIN=C:\Program Files\PostgreSQL\16\bin

:: Days to retain backups
set RETAIN_DAYS=30

:: ── Date stamp ─────────────────────────────────────────────
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set dt=%%I
set DATESTAMP=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%

set DB_BACKUP=%BACKUP_DIR%\db\clinic_%DATESTAMP%.sql
set FILES_BACKUP=%BACKUP_DIR%\files

:: ── Create backup directories ───────────────────────────────
if not exist "%BACKUP_DIR%\db"    mkdir "%BACKUP_DIR%\db"
if not exist "%BACKUP_DIR%\files" mkdir "%BACKUP_DIR%\files"

echo [%DATESTAMP%] Starting Clinic EHR backup...

:: ── Database dump ───────────────────────────────────────────
echo Backing up database...
set PGPASSWORD=%DB_PASSWORD%
"%PGBIN%\pg_dump" -U %DB_USER% -h localhost %DB_NAME% > "%DB_BACKUP%"
if %errorlevel% neq 0 (
  echo ERROR: Database backup failed!
  exit /b 1
)
echo Database backup saved: %DB_BACKUP%

:: ── File storage mirror ─────────────────────────────────────
echo Backing up patient files...
robocopy "%DATA_DIR%\patients" "%FILES_BACKUP%\latest" /MIR /NFL /NDL /NJH /NJS
echo Files backup updated: %FILES_BACKUP%\latest

:: ── Remove old database backups ─────────────────────────────
echo Removing backups older than %RETAIN_DAYS% days...
forfiles /P "%BACKUP_DIR%\db" /S /M *.sql /D -%RETAIN_DAYS% /C "cmd /c del @path" 2>nul

echo [%DATESTAMP%] Backup complete.
endlocal
