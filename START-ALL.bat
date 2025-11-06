@echo off
color 0E
echo.
echo ========================================
echo   TAWASOL CRM - STARTING ALL SERVERS
echo ========================================
echo.
echo Starting Backend Server (Port 3000)...
start "Tawasol Backend" cmd /c "cd /d %~dp0 && start-backend.bat"
timeout /t 2 /nobreak >nul
echo.
echo Starting Frontend App (Port 5173)...
start "Tawasol Frontend" cmd /c "cd /d %~dp0 && start-frontend.bat"
echo.
echo ========================================
echo   ALL SERVERS STARTED!
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit this window...
echo (The servers will keep running in separate windows)
pause >nul
