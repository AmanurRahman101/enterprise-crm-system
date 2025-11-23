@echo off
echo.
echo ========================================
echo   SSL Certificate Generator
echo ========================================
echo.
echo This script will generate SSL certificates for HTTPS.
echo Each team member needs to run this to get their own .crt files.
echo.
echo Certificates will be created in:
echo   - Frontend\cert\localhost.crt
echo   - Frontend\cert\localhost.key
echo   - Backend\cert\localhost.crt (copied from Frontend)
echo   - Backend\cert\localhost.key (copied from Frontend)
echo.
pause

REM Create cert directories if they don't exist
if not exist "Frontend\cert\" mkdir "Frontend\cert"
if not exist "Backend\cert\" mkdir "Backend\cert"

REM Run PowerShell script to generate certificates
cd Frontend
powershell -ExecutionPolicy Bypass -File "generate-cert.ps1"
cd ..

REM Copy certificates to Backend
if exist "Frontend\cert\localhost.crt" (
    echo.
    echo Copying certificates to Backend...
    copy "Frontend\cert\localhost.crt" "Backend\cert\localhost.crt" >nul
    copy "Frontend\cert\localhost.key" "Backend\cert\localhost.key" >nul
    echo.
    echo ========================================
    echo   Certificates Generated Successfully!
    echo ========================================
    echo.
    echo Your certificates are located at:
    echo   Frontend\cert\localhost.crt
    echo   Frontend\cert\localhost.key
    echo   Backend\cert\localhost.crt
    echo   Backend\cert\localhost.key
    echo.
    echo You can now run start.bat to start the servers with HTTPS.
    echo.
) else (
    echo.
    echo ========================================
    echo   Certificate Generation Failed
    echo ========================================
    echo.
    echo Please try one of these options:
    echo.
    echo Option 1: Install mkcert (RECOMMENDED)
    echo   1. Download from: https://github.com/FiloSottile/mkcert/releases
    echo   2. Run: mkcert -install
    echo   3. Run: cd Frontend
    echo   4. Run: mkcert -cert-file cert/localhost.crt -key-file cert/localhost.key localhost 127.0.0.1
    echo   5. Copy cert files to Backend\cert\
    echo.
    echo Option 2: Use OpenSSL
    echo   1. Install OpenSSL
    echo   2. Run: cd Frontend
    echo   3. Run: openssl genrsa -out cert/localhost.key 2048
    echo   4. Run: openssl req -new -x509 -key cert/localhost.key -out cert/localhost.crt -days 365 -subj "/CN=localhost"
    echo   5. Copy cert files to Backend\cert\
    echo.
)

pause

