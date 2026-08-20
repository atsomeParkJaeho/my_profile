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

# [1/5] React client build
Write-Host "[1/5] React client build..." -ForegroundColor Cyan
Set-Location "$root\client"
npm run build

# [2/5] NestJS build + pkg -> server.exe
Write-Host "[2/5] NestJS build + exe packaging..." -ForegroundColor Cyan
Set-Location "$root\server"
$env:NODE_ENV = "production"
npm run build:exe
$env:NODE_ENV = ""

# [3/5] Copy .env.dev and client/dist to release folder
Write-Host "[3/5] Copy env file and client dist..." -ForegroundColor Cyan
$releaseDir = "$root\release"
if (-not (Test-Path $releaseDir)) { New-Item -ItemType Directory -Path $releaseDir | Out-Null }

Copy-Item "$root\server\.env.dev" "$releaseDir\.env" -Force
Write-Host "  .env.dev -> release\.env done"

if (Test-Path "$releaseDir\client") { Remove-Item "$releaseDir\client" -Recurse -Force }
Copy-Item "$root\client\dist" "$releaseDir\client\dist" -Recurse -Force
Write-Host "  client/dist -> release/client/dist done"

# [4/5] Electron viewer build
Write-Host "[4/5] Electron viewer build..." -ForegroundColor Cyan
Set-Location "$root\viewer"
npm install
npm run pack

# 빌드된 Electron exe를 release 폴더로 복사
$electronExe = Get-ChildItem "$root\viewer\dist\win-unpacked\*.exe" | Select-Object -First 1
if ($electronExe) {
  Write-Host "  Electron build done: $($electronExe.Name)"
} else {
  Write-Host "[Warning] Electron exe not found in viewer\dist\win-unpacked\" -ForegroundColor Yellow
}

# [5/5] Inno Setup installer
Write-Host "[5/5] Build installer..." -ForegroundColor Cyan
Set-Location $root

if ($innoPath) {
  if (-not (Test-Path "$root\installer")) {
    New-Item -ItemType Directory -Path "$root\installer" | Out-Null
  }
  & $innoPath "$root\setup.iss"
  Write-Host "[Done]" -ForegroundColor Green
  Write-Host "  Server exe : $releaseDir\server.exe"
  Write-Host "  Viewer exe : $releaseDir\Renshu.exe"
  Write-Host "  Installer  : $root\installer\RenshuSetup.exe"
} else {
  Write-Host "[Warning] Inno Setup not found. Skipping installer." -ForegroundColor Yellow
  Write-Host "  Download: https://jrsoftware.org/isinfo.php"
  Write-Host "[Done] Executable only" -ForegroundColor Green
  Write-Host "  Server exe : $releaseDir\server.exe"
  Write-Host "  Viewer exe : $releaseDir\Renshu.exe"
}

Write-Host "  URL        : http://localhost:3000"
Set-Location $root
