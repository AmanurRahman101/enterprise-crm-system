@echo off
title Tawasol CRM - Backend Server
color 0A
echo.
echo ========================================
echo  TAWASOL CRM - Backend Server
echo ========================================
echo.
cd /d "%~dp0"
if not exist "package.json" (
    echo ERROR: Cannot find package.json
    echo Current directory: %CD%
    pause
    exit /b 1
)
echo Current directory: %CD%
echo Starting backend on port 3000...
echo.
call npm run dev
if errorlevel 1 (
    echo.
    echo ERROR: Backend failed to start
    echo Check the error messages above
    pause
)
pause
