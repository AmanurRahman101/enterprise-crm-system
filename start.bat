@echo off
echo.
echo ========================================
echo   Starting Tawasol CRM System
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if MySQL is running
echo [1/6] Checking MySQL connection...
mysql -u root -e "SELECT 1" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] MySQL is not running or not accessible!
    echo Please start MySQL server first.
    echo.
    choice /C YN /M "Continue anyway"
    if errorlevel 2 exit /b 1
)

REM Check if database exists
echo [2/6] Checking database...
mysql -u root -e "USE tawasol_crm;" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Database 'tawasol_crm' does not exist!
    echo.
    choice /C YN /M "Do you want to create it now"
    if errorlevel 2 (
        echo Please run: mysql -u root -p ^< Backend/schema.sql
        pause
        exit /b 1
    )
    echo Creating database...
    mysql -u root -e "CREATE DATABASE tawasol_crm;"
    mysql -u root tawasol_crm < Backend\schema.sql
    echo Database created successfully!
)

REM Check if SSL certificates exist, generate if missing
echo [3/6] Checking SSL certificates...
if not exist "Backend\cert\localhost.crt" (
    echo SSL certificates not found. Generating...
    echo.
    echo This will create self-signed certificates for HTTPS.
    echo You may see security warnings in browsers - this is normal for development.
    echo.
    cd Backend
    if not exist "cert\" mkdir cert
    cd ..
    cd Frontend
    if not exist "cert\" mkdir cert
    powershell -ExecutionPolicy Bypass -File "generate-cert.ps1"
    cd ..
    echo.
    echo Copying certificates to Backend...
    if exist "Frontend\cert\localhost.crt" (
        copy "Frontend\cert\localhost.crt" "Backend\cert\localhost.crt" >nul
        copy "Frontend\cert\localhost.key" "Backend\cert\localhost.key" >nul
        echo Certificates generated and copied successfully!
    ) else (
        echo WARNING: Certificate generation may have failed.
        echo You can generate certificates manually by running:
        echo   cd Frontend
        echo   powershell -ExecutionPolicy Bypass -File generate-cert.ps1
        echo   Then copy cert\*.crt and cert\*.key to Backend\cert\
    )
    echo.
)

REM Check if backend dependencies are installed
echo [4/6] Checking Backend dependencies...
if not exist "Backend\node_modules\" (
    echo Installing Backend dependencies...
    cd Backend
    call npm install
    cd ..
    echo Backend dependencies installed!
) else (
    echo Backend dependencies already installed.
)

REM Check if frontend dependencies are installed
echo [5/6] Checking Frontend dependencies...
if not exist "Frontend\node_modules\" (
    echo Installing Frontend dependencies...
    cd Frontend
    call npm install
    cd ..
    echo Frontend dependencies installed!
) else (
    echo Frontend dependencies already installed.
)


echo.
echo ========================================
echo   Starting Servers...
echo ========================================
echo.

REM Start Backend Server in new window
echo Starting Backend Server (Port 3000)...
start "Tawasol CRM - Backend" cmd /k "cd Backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend Server in new window
echo Starting Frontend Server (Port 5173)...
start "Tawasol CRM - Frontend" cmd /k "cd Frontend && npm run dev"

echo.
echo ========================================
echo   Tawasol CRM Started Successfully!
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Two new windows have opened:
echo   1. Backend Server (Node.js/Express)
echo   2. Frontend Server (Vite/React)
echo.
echo Close those windows to stop the servers.
echo Or run stop.bat to stop all servers.
echo.
echo ========================================
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul

REM Open browser
start https://localhost:5173

echo.
echo System is running! Press any key to return...
pause >nul

