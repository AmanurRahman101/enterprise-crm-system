@echo off
color 0C
echo.
echo ========================================
echo   TAWASOL CRM - STOPPING ALL SERVERS
echo ========================================
echo.
echo Stopping all Node.js processes...
echo.
powershell -Command "Get-Process | Where-Object {$_.ProcessName -eq 'node'} | Stop-Process -Force"
echo.
echo ========================================
echo   ALL SERVERS STOPPED!
echo ========================================
echo.
echo Press any key to exit...
pause >nul
