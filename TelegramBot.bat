@echo off
echo.
echo ========================================
echo   Starting Tawasol CRM Telegram Bot
echo ========================================
echo.

REM Navigate to Backend directory
cd /d "%~dp0Backend"

REM Check if node_modules exist
if not exist "node_modules\" (
    echo Installing backend dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo Launching Telegram bot...
echo (Press Ctrl+C in this window to stop the bot)
echo.

npm run bot

echo.
echo Telegram bot stopped.
pause

