@echo off
echo ========================================
echo Stopping Tawasol CRM Project
echo ========================================
echo.

echo Stopping Backend Server (Node.js on Port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
timeout /t 1 /nobreak >nul

echo Stopping Frontend Server (Vite on Port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
timeout /t 1 /nobreak >nul

echo Closing Terminal Windows...
taskkill /FI "WindowTitle eq Tawasol CRM - Backend*" /F 2>nul
taskkill /FI "WindowTitle eq Tawasol CRM - Frontend*" /F 2>nul

echo.
echo ========================================
echo All servers stopped successfully!
echo ========================================
echo.
pause
