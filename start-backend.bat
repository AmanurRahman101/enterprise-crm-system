@echo off
title Tawasol CRM - Backend Server
color 0A
echo.
echo ========================================
echo   TAWASOL CRM - BACKEND SERVER
echo ========================================
echo.
echo Starting backend server on port 3000...
echo.
cd /d "%~dp0backend"
npm run dev
