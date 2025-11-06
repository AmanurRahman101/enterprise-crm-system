# TAWASOL CRM - Public Link Generator
# PowerShell Version - Shows URLs directly

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "       TAWASOL CRM - PUBLIC LINK GENERATOR" -ForegroundColor Yellow
Write-Host "============================================================`n" -ForegroundColor Cyan

Write-Host "Checking LocalTunnel installation..." -ForegroundColor Gray

# Check if localtunnel is installed
$ltInstalled = Get-Command lt -ErrorAction SilentlyContinue
if (-not $ltInstalled) {
    Write-Host "Installing LocalTunnel (this may take a minute)..." -ForegroundColor Yellow
    npm install -g localtunnel | Out-Null
    Write-Host "LocalTunnel installed!`n" -ForegroundColor Green
} else {
    Write-Host "LocalTunnel is ready!`n" -ForegroundColor Green
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Starting tunnels... Please wait..." -ForegroundColor Yellow
Write-Host "============================================================`n" -ForegroundColor Cyan

# Start backend tunnel in background
Write-Host "[1/2] Creating Backend API tunnel (port 3000)..." -ForegroundColor Gray
$backendJob = Start-Job -ScriptBlock {
    $output = lt --port 3000 2>&1 | Out-String
    $output
}

Start-Sleep -Seconds 3

# Start frontend tunnel in background  
Write-Host "[2/2] Creating Frontend App tunnel (port 5173)..." -ForegroundColor Gray
$frontendJob = Start-Job -ScriptBlock {
    $output = lt --port 5173 2>&1 | Out-String
    $output
}

Write-Host "`nWaiting for URLs to generate...`n" -ForegroundColor Gray
Start-Sleep -Seconds 5

# Get URLs from jobs
$backendOutput = Receive-Job -Job $backendJob
$frontendOutput = Receive-Job -Job $frontendJob

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "          YOUR PUBLIC LINKS ARE READY!" -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Cyan

# Extract and display backend URL
if ($backendOutput -match 'your url is: (https://[^\s]+)') {
    $backendUrl = $matches[1]
    Write-Host "BACKEND API URL:" -ForegroundColor Yellow
    Write-Host "  $backendUrl" -ForegroundColor White
    Write-Host ""
}

# Extract and display frontend URL
if ($frontendOutput -match 'your url is: (https://[^\s]+)') {
    $frontendUrl = $matches[1]
    Write-Host "FRONTEND APP URL (Share this!):" -ForegroundColor Yellow
    Write-Host "  $frontendUrl" -ForegroundColor Green
    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "  1. Copy the FRONTEND URL above (the green one)" -ForegroundColor Gray
Write-Host "  2. Share it with anyone" -ForegroundColor Gray
Write-Host "  3. They can access your CRM in their browser" -ForegroundColor Gray
Write-Host "`n  NOTE: First-time visitors may see 'Click to Continue'" -ForegroundColor DarkGray
Write-Host "        This is normal - just click the button" -ForegroundColor DarkGray
Write-Host "`n  IMPORTANT: Keep this window open!" -ForegroundColor Red
Write-Host "             Closing it stops the public links" -ForegroundColor Red
Write-Host "============================================================`n" -ForegroundColor Cyan

Write-Host "Press Ctrl+C to stop the tunnels and close this window" -ForegroundColor Yellow
Write-Host ""

# Keep jobs running
Wait-Job -Job $backendJob, $frontendJob
