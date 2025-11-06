@echo off
echo.
echo ========================================
echo   TAWASOL CRM - PUBLIC LINK GENERATOR
echo ========================================
echo.
echo Starting tunnels for your CRM...
echo.
echo IMPORTANT: Keep this window open!
echo Closing it will stop the public links.
echo.
echo ========================================
echo.

REM Start backend tunnel
start "TAWASOL Backend Tunnel" cmd /k "echo Backend API Tunnel && lt --port 3000"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend tunnel
start "TAWASOL Frontend Tunnel" cmd /k "echo Frontend App Tunnel && lt --port 5173"

echo.
echo ========================================
echo   Tunnels are starting!
echo ========================================
echo.
echo Two new windows will open showing your public URLs.
echo.
echo Look for lines that say:
echo   "your url is: https://xxxxx.loca.lt"
echo.
echo Share the FRONTEND URL with anyone you want to access your CRM!
echo.
echo NOTE: The first time someone visits, they may need to click
echo       "Click to Continue" on the localtunnel page.
echo.
echo ========================================
echo Press any key to close this window...
pause >nul
