@echo off
echo ========================================
echo Starting Tawasol CRM - PRODUCTION MODE
echo ========================================
echo.

:: Build frontend if build folder doesn't exist
if not exist "frontend\build" (
    echo Building optimized frontend...
    cd frontend
    call npm run build
    cd ..
    echo.
)

:: Start backend in a new terminal
echo Starting Backend Server (Port 5000)...
start "Tawasol Backend" cmd /k "cd backend && npm run dev"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak > nul

:: Start frontend production server in a new terminal
echo Starting Frontend Production Server (Port 3000)...
start "Tawasol Frontend (Production)" cmd /k "cd frontend && npx serve -s build -l 3000"

:: Get network IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" ^| findstr /v "127.0.0.1"') do (
    set IP=%%a
    goto :found
)
:found
:: Trim leading spaces
for /f "tokens=* delims= " %%a in ("%IP%") do set IP=%%a

echo.
echo ========================================
echo Both servers are starting...
echo.
echo LOCALHOST ACCESS:
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000 (OPTIMIZED)
echo.
echo NETWORK ACCESS (from other devices):
echo   Backend:  http://%IP%:5000
echo   Frontend: http://%IP%:3000
echo ========================================
echo.
echo This is running the OPTIMIZED production build
echo which is 5-10x FASTER than development mode!
echo.
echo Press any key to close this window...
pause > nul
