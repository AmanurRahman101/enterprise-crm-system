@echo off
echo ========================================
echo Stopping Tawasol CRM Servers
echo ========================================
echo.

:: Kill processes on port 5000 (Backend)
echo Stopping Backend Server (Port 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    taskkill /F /PID %%a 2>nul
)

:: Kill processes on port 3000 (Frontend)
echo Stopping Frontend Server (Port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /F /PID %%a 2>nul
)

:: Kill all node processes with specific titles
echo Stopping any remaining Node processes...
taskkill /FI "WindowTitle eq Tawasol Backend*" /F 2>nul
taskkill /FI "WindowTitle eq Tawasol Frontend*" /F 2>nul

echo.
echo ========================================
echo All servers stopped successfully!
echo ========================================
echo.
pause
