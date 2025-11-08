@echo off
echo ========================================
echo   TEMPORARILY DISABLE WINDOWS FIREWALL
echo ========================================
echo.
echo This will turn OFF Windows Firewall to test if it's blocking your phone.
echo.
pause

netsh advfirewall set allprofiles state off

echo.
echo ========================================
echo   FIREWALL DISABLED
echo ========================================
echo.
echo Now try logging in from your phone!
echo.
echo After testing, run: enable-firewall.bat
echo.
pause
