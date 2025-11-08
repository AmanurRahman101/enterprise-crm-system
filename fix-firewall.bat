@echo off
echo ========================================
echo Fixing Windows Firewall for Network Access
echo ========================================
echo.

echo Removing old firewall rules...
netsh advfirewall firewall delete rule name="Tawasol CRM Backend" >nul 2>&1
netsh advfirewall firewall delete rule name="Tawasol CRM Frontend" >nul 2>&1
netsh advfirewall firewall delete rule name="Tawasol Frontend" >nul 2>&1
netsh advfirewall firewall delete rule name="Tawasol Backend" >nul 2>&1

echo.
echo Adding new firewall rules for ALL network profiles...

echo Adding rule for Backend (Port 5000)...
netsh advfirewall firewall add rule name="Tawasol CRM Backend" dir=in action=allow protocol=TCP localport=5000 profile=any enable=yes

echo Adding rule for Frontend (Port 3000)...
netsh advfirewall firewall add rule name="Tawasol CRM Frontend" dir=in action=allow protocol=TCP localport=3000 profile=any enable=yes

echo.
echo ========================================
echo Firewall configuration complete!
echo ========================================
echo.
echo Backend (Port 5000): Allowed
echo Frontend (Port 3000): Allowed
echo Profiles: Domain, Private, Public (ALL)
echo.
echo You can now access the application from other devices:
echo   http://192.168.1.7:3000
echo.
pause
