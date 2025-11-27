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
echo [1/5] Checking MySQL connection...
mysql -u root -e "SELECT 1" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] MySQL is not running or not accessible!
    echo Please start MySQL server first.
    echo.
    choice /C YN /M "Continue anyway"
    if errorlevel 2 exit /b 1
)

REM Check if database exists
echo [2/5] Checking database...
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

REM Check if backend dependencies are installed
echo [3/5] Checking Backend dependencies...
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
echo [4/5] Checking Frontend dependencies...
if not exist "Frontend\node_modules\" (
    echo Installing Frontend dependencies...
    cd Frontend
    call npm install
    cd ..
    echo Frontend dependencies installed!
) else (
    echo Frontend dependencies already installed.
)

@REM REM Check if .env file exists
@REM echo [5/5] Checking configuration...
@REM if not exist "Backend\.env" (
@REM     echo [WARNING] Backend/.env file not found!
@REM     if exist "Backend\.env.example" (
@REM         echo Creating Backend/.env from .env.example...
@REM         copy "Backend\.env.example" "Backend\.env"
@REM         echo.
@REM         echo [IMPORTANT] Please edit Backend/.env and update the following:
@REM         echo   - DB_PASSWORD (your MySQL password)
@REM         echo   - JWT_SECRET (change to a random string)
@REM         echo   - AGORA_APP_ID (get from https://console.agora.io/)
@REM         echo   - AGORA_APP_CERTIFICATE (get from https://console.agora.io/)
@REM         echo.
@REM         timeout /t 5 /nobreak >nul
@REM     ) else (
@REM         echo Please create Backend/.env file manually.
@REM         echo See README.md for required environment variables.
@REM         echo.
@REM         choice /C YN /M "Continue without .env file (may cause errors)"
@REM         if errorlevel 2 exit /b 1
@REM     )
@REM )
@REM if not exist "Frontend\.env" (
@REM     echo [WARNING] Frontend/.env file not found!
@REM     if exist "Frontend\.env.example" (
@REM         echo Creating Frontend/.env from .env.example...
@REM         copy "Frontend\.env.example" "Frontend\.env"
@REM         echo Frontend/.env created with default localhost settings.
@REM         echo Update it if you need LAN/mobile access.
@REM         echo.
@REM     )
@REM )

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
start http://localhost:5173

echo.
echo System is running! Press any key to return...
pause >nul

