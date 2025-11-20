@echo off
echo ========================================
echo Starting Tawasol CRM Project
echo ========================================
echo.

REM Check if node_modules exist in Backend
if not exist "Backend\node_modules" (
    echo Installing Backend dependencies...
    cd Backend
    call npm install
    cd ..
    echo.
)

REM Check if node_modules exist in Frontend
if not exist "Frontend\node_modules" (
    echo Installing Frontend dependencies...
    cd Frontend
    call npm install
    cd ..
    echo.
)

echo Starting Backend Server (Port 3000)...
start "Tawasol CRM - Backend" cmd /k "cd Backend && npm start"
timeout /t 3 /nobreak >nul

echo Starting Frontend Server (Port 5173)...
start "Tawasol CRM - Frontend" cmd /k "cd Frontend && npm run dev"

echo.
echo ========================================
echo Tawasol CRM is starting...
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to open the application in your browser...
pause >nul
start http://localhost:5173
