@echo off
echo.
echo ========================================
echo   Stopping Tawasol CRM System
echo ========================================
echo.

REM Kill Node.js processes (Backend and Frontend)
echo Stopping all Node.js servers...
echo.

REM Kill processes using port 3000 (Backend)
echo Checking port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Found process %%a using port 3000, killing it...
    taskkill /PID %%a /F >nul 2>nul
)

REM Kill processes using port 5173 (Frontend)
echo Checking port 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo Found process %%a using port 5173, killing it...
    taskkill /PID %%a /F >nul 2>nul
)

REM Find and kill processes by window title
echo Checking for server windows...
taskkill /FI "WINDOWTITLE eq Tawasol CRM - Backend*" /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq Tawasol CRM - Frontend*" /F >nul 2>nul

REM Wait a moment for processes to stop
timeout /t 1 /nobreak >nul

REM Verify ports are free
netstat -ano | findstr :3000 >nul 2>nul
if errorlevel 1 (
    echo Port 3000 is now free.
) else (
    echo [WARNING] Port 3000 is still in use.
)

netstat -ano | findstr :5173 >nul 2>nul
if errorlevel 1 (
    echo Port 5173 is now free.
) else (
    echo [WARNING] Port 5173 is still in use.
)

echo.
echo All Tawasol CRM servers stopped successfully!

echo.
echo ========================================
echo   Tawasol CRM Stopped
echo ========================================
echo.
echo Ports 3000 and 5173 are now free.
echo You can restart with start.bat
echo.
pause

