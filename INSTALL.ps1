# Tawasol CRM - Quick Installation Script for Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Tawasol CRM - Installation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install from https://nodejs.org/" -ForegroundColor Red
    exit
}

# Check MySQL
Write-Host "Checking MySQL..." -ForegroundColor Yellow
try {
    $mysqlVersion = mysql --version
    Write-Host "✓ MySQL installed" -ForegroundColor Green
} catch {
    Write-Host "⚠ MySQL not found. Make sure it's installed and in PATH" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step 1: Backend Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Backend setup
Set-Location Backend
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "⚠ .env file not found!" -ForegroundColor Yellow
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Edit Backend/.env file and update:" -ForegroundColor Red
    Write-Host "  - DB_PASSWORD (your MySQL password)" -ForegroundColor Red
    Write-Host "  - JWT_SECRET (change to a secure random string)" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter after you've updated the .env file"
}

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step 2: Frontend Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Frontend setup
Set-Location Frontend
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install
Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Create database in MySQL:" -ForegroundColor White
Write-Host "   mysql -u root -p" -ForegroundColor Gray
Write-Host "   CREATE DATABASE tawasol_crm;" -ForegroundColor Gray
Write-Host "   USE tawasol_crm;" -ForegroundColor Gray
Write-Host "   SOURCE C:/path/to/Backend/schema.sql;" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start Backend (in one terminal):" -ForegroundColor White
Write-Host "   cd Backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start Frontend (in another terminal):" -ForegroundColor White
Write-Host "   cd Frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Access application:" -ForegroundColor White
Write-Host "   http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy Coding! 🚀" -ForegroundColor Green
