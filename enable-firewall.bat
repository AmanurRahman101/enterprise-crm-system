@echo off
echo ========================================
echo   RE-ENABLE WINDOWS FIREWALL
echo ========================================
echo.

netsh advfirewall set allprofiles state on

echo.
echo ========================================
echo   FIREWALL ENABLED
echo ========================================
echo.
echo Windows Firewall is now back ON (recommended for security)
echo.
pause
