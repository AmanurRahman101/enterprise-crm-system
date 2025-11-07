@echo off
echo ========================================
echo Starting Tawasol CRM
echo ========================================
echo.

:: Start backend in a new terminal
echo Starting Backend Server (Port 5000)...
start "Tawasol Backend" cmd /k "cd backend && npm run dev"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak > nul

:: Start frontend in a new terminal
echo Starting Frontend Server (Port 3000)...
start "Tawasol Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo Both servers are starting...
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to close this window...
pause > nul
