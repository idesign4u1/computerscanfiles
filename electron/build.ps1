# Build script for Disk Space Analyzer
# Sets environment variables to disable code signing before building

$ErrorActionPreference = "Stop"

Write-Host "Building Disk Space Analyzer..." -ForegroundColor Green

# Set environment variables to disable code signing
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
$env:WIN_CSC_LINK = ""
$env:WIN_CSC_KEY_PASSWORD = ""

# Build frontend
Write-Host "Building frontend..." -ForegroundColor Cyan
Push-Location ..\frontend
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Pop-Location

# Copy backend to electron directory for packaging
Write-Host "Copying backend..." -ForegroundColor Cyan
$backendSource = "..\backend"
$backendDest = ".\backend"
if (Test-Path $backendSource) {
    if (Test-Path $backendDest) {
        Remove-Item $backendDest -Recurse -Force
    }
    Copy-Item $backendSource $backendDest -Recurse
    Write-Host "Backend copied successfully" -ForegroundColor Green
} else {
    Write-Host "Warning: Backend directory not found at $backendSource" -ForegroundColor Yellow
}

# Build unpacked electron app
Write-Host "Packaging Electron app..." -ForegroundColor Cyan
& .\node_modules\.bin\electron-builder --dir

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Build complete!" -ForegroundColor Green
Write-Host "App location: $(Get-Item 'dist\win-unpacked' | Select-Object -ExpandProperty FullName)" -ForegroundColor Green
