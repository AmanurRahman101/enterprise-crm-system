# Generate Self-Signed SSL Certificate for Development
# This allows microphone access on mobile browsers
# Each team member should run this script to generate their own certificates

Write-Host "========================================="
Write-Host "  SSL Certificate Generator"
Write-Host "========================================="
Write-Host ""
Write-Host "This script will generate SSL certificates for HTTPS."
Write-Host "Each team member needs to run this to get their own .crt files."
Write-Host ""
Write-Host "Generating self-signed SSL certificate for development..."
Write-Host ""

# Create cert directory if it doesn't exist
$certPath = ".\cert"
if (-not (Test-Path $certPath)) {
    New-Item -ItemType Directory -Path $certPath | Out-Null
    Write-Host "Created cert directory: $certPath"
}

$certFile = "$certPath\localhost.crt"
$keyFile = "$certPath\localhost.key"

# Check if OpenSSL is available
$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue

if (-not $opensslPath) {
    Write-Host "OpenSSL not found. Trying alternative method..."
    
    # Use PowerShell to create certificate (Windows 10+)
    $cert = New-SelfSignedCertificate -DnsName "localhost", "192.168.0.101", "127.0.0.1" -CertStoreLocation "cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(1) -KeyExportPolicy Exportable -KeySpec Signature -KeyUsage DigitalSignature, KeyEncipherment
    
    Write-Host "✓ Certificate created in Windows Certificate Store"
    Write-Host ""
    Write-Host "Certificate Thumbprint: $($cert.Thumbprint)"
    Write-Host ""
    Write-Host "To use this certificate with Vite:"
    Write-Host "1. Export it manually from Certificate Manager (certmgr.msc)"
    Write-Host "2. Or use mkcert (recommended): https://github.com/FiloSottile/mkcert"
    Write-Host ""
    Write-Host "==================================="
    Write-Host "RECOMMENDED APPROACH: Use mkcert"
    Write-Host "==================================="
    Write-Host ""
    Write-Host "Install mkcert:"
    Write-Host "  choco install mkcert"
    Write-Host "  OR download from: https://github.com/FiloSottile/mkcert/releases"
    Write-Host ""
    Write-Host "Then run:"
    Write-Host "  cd Frontend"
    Write-Host "  mkcert -install"
    Write-Host "  mkcert -cert-file cert/localhost.crt -key-file cert/localhost.key localhost 192.168.0.101 127.0.0.1"
    Write-Host ""
    
} else {
    Write-Host "OpenSSL found, generating certificate..."
    
    # Generate private key
    & openssl genrsa -out $keyFile 2048
    
    # Get local IP address for certificate
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*" } | Select-Object -First 1).IPAddress
    if (-not $localIP) {
        $localIP = "127.0.0.1"
    }
    
    # Generate certificate
    & openssl req -new -x509 -key $keyFile -out $certFile -days 365 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:$localIP,IP:127.0.0.1"
    
    Write-Host ""
    Write-Host "✓ Certificate generated successfully!"
    Write-Host "  Certificate: $certFile"
    Write-Host "  Private Key: $keyFile"
    Write-Host "  Valid for: localhost, $localIP, 127.0.0.1"
    Write-Host ""
    Write-Host "IMPORTANT: Copy these files to Backend\cert\ folder:"
    Write-Host "  copy cert\localhost.crt ..\Backend\cert\localhost.crt"
    Write-Host "  copy cert\localhost.key ..\Backend\cert\localhost.key"
    Write-Host ""
}

Write-Host "==================================="
Write-Host "NEXT STEPS:"
Write-Host "==================================="
Write-Host ""
Write-Host "If you don't have mkcert, the easiest solution is:"
Write-Host ""
Write-Host "Option 1: Install mkcert (RECOMMENDED)"
Write-Host "  1. Download from: https://github.com/FiloSottile/mkcert/releases"
Write-Host "  2. Run: mkcert -install"
Write-Host "  3. Run: mkcert -cert-file cert/localhost.crt -key-file cert/localhost.key localhost 192.168.0.101"
Write-Host ""
Write-Host "Option 2: Accept self-signed certificate warnings"
Write-Host "  - Browser will show security warning"
Write-Host "  - Click 'Advanced' -> 'Proceed anyway' on both devices"
Write-Host ""

pause


