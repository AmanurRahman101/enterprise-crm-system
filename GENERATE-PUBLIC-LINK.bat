@echo off
cls
echo.
echo ============================================================
echo          TAWASOL CRM - GENERATING PUBLIC LINKS
echo ============================================================
echo.
echo Please wait while we create your public URLs...
echo.

REM Check if localtunnel is installed
where lt >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing LocalTunnel...
    call npm install -g localtunnel
    echo.
)

echo Starting Backend Tunnel (Port 3000)...
echo.
start /MIN cmd /c "lt --port 3000 > %TEMP%\backend-url.txt 2>&1"

timeout /t 3 /nobreak >nul

echo Starting Frontend Tunnel (Port 5173)...
echo.
start /MIN cmd /c "lt --port 5173 > %TEMP%\frontend-url.txt 2>&1"

echo.
echo Waiting for tunnels to initialize...
timeout /t 8 /nobreak >nul

cls
echo.
echo ============================================================
echo          YOUR PUBLIC LINKS ARE READY!
echo ============================================================
echo.

REM Try to read URLs from temp files
if exist "%TEMP%\backend-url.txt" (
    echo BACKEND API URL:
    type "%TEMP%\backend-url.txt" | findstr "https://"
    echo.
)

if exist "%TEMP%\frontend-url.txt" (
    echo FRONTEND APP URL (Share this one):
    type "%TEMP%\frontend-url.txt" | findstr "https://"
    echo.
)

echo ============================================================
echo.
echo INSTRUCTIONS:
echo.
echo 1. Copy the FRONTEND URL above
echo 2. Share it with anyone you want to access your CRM
echo 3. They can open it in their browser
echo.
echo NOTE: If tunnels didn't start, try running this again
echo       or check the minimized windows for URLs
echo.
echo KEEP THIS WINDOW OPEN or the links will stop working!
echo.
echo ============================================================
echo.
echo Press any key to stop the tunnels and close...
pause >nul

REM Kill localtunnel processes
taskkill /F /IM node.exe /FI "WINDOWTITLE eq lt*" >nul 2>&1

echo.
echo Tunnels closed. Have a great day!
timeout /t 2 >nul
