@echo off
title Tawasol CRM - Frontend App
color 0B
echo.
echo ========================================
echo   TAWASOL CRM - FRONTEND APP
echo ========================================
echo.
echo Starting frontend on port 5173...
echo.
cd /d "%~dp0frontend"
npm run dev
