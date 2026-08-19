# exe + installer build script
# Run: .\build-exe.ps1
#
# Requirements:
#   - Node.js
#   - Inno Setup (https://jrsoftware.org/isinfo.php)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

# Inno Setup path detection
$innoPath = @(
  "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
  "C:\Program Files\Inno Setup 6\ISCC.exe",
  "C:\Program Files (x86)\Inno Setup 5\ISCC.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

# [1/4] React client build
Write-Host "[1/4] React client build..." -ForegroundColor Cyan
Set-Location "$root\client"
npm run build

# [2/4] NestJS build + pkg -> server.exe
Write-Host "[2/4] NestJS build + exe packaging..." -ForegroundColor Cyan
Set-Location "$root\server"
$env:NODE_ENV = "production"
npm run build:exe
$env:NODE_ENV = ""

# [3/4] Copy .env.dev and client/dist to release folder
Write-Host "[3/4] Copy env file and client dist..." -ForegroundColor Cyan
$releaseDir = "$root\release"
if (-not (Test-Path $releaseDir)) { New-Item -ItemType Directory -Path $releaseDir | Out-Null }

Copy-Item "$root\server\.env.dev" "$releaseDir\.env" -Force
Write-Host "  .env.dev -> release\.env done"

# server.exe가 실행 시 같은 폴더의 client/dist 에서 정적 파일을 찾음
if (Test-Path "$releaseDir\client") { Remove-Item "$releaseDir\client" -Recurse -Force }
Copy-Item "$root\client\dist" "$releaseDir\client\dist" -Recurse -Force
Write-Host "  client/dist -> release/client/dist done"

# [4/4] Inno Setup installer
Write-Host "[4/4] Build installer..." -ForegroundColor Cyan
Set-Location $root

if ($innoPath) {
  if (-not (Test-Path "$root\installer")) {
    New-Item -ItemType Directory -Path "$root\installer" | Out-Null
  }
  & $innoPath "$root\setup.iss"
  Write-Host "[Done]" -ForegroundColor Green
  Write-Host "  Executable : $releaseDir\server.exe"
  Write-Host "  Installer  : $root\installer\RenshuSetup.exe"
} else {
  Write-Host "[Warning] Inno Setup not found. Skipping installer." -ForegroundColor Yellow
  Write-Host "  Download: https://jrsoftware.org/isinfo.php"
  Write-Host "[Done] Executable only" -ForegroundColor Green
  Write-Host "  Executable : $releaseDir\server.exe"
}

Write-Host "  URL        : http://localhost:3000"
Set-Location $root
