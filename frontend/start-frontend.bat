@echo off
title Tawasol CRM - Frontend Server
color 0B
echo.
echo ========================================
echo  TAWASOL CRM - Frontend Server
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
echo Starting frontend on port 5173...
echo.
call npm run dev
if errorlevel 1 (
    echo.
    echo ERROR: Frontend failed to start
    echo Check the error messages above
    pause
)
pause
