# exe + installer build script
# Run: .\build-exe.ps1
#
# Requirements:
#   - Node.js
#   - Inno Setup 6 (https://jrsoftware.org/isinfo.php)
#
# 구조 변경: server.exe(pkg) 제거 → Electron utilityProcess 방식으로 변경
# 이유: pkg 번들 exe가 백신에 악성코드로 오탐 탐지됨

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

# [2/4] NestJS build (TypeScript → JavaScript only, pkg 사용 안 함)
Write-Host "[2/4] NestJS build..." -ForegroundColor Cyan
Set-Location "$root\server"
npm run build

# server/node_modules 설치 (puppeteer Chromium 자동 다운로드 방지)
Write-Host "  server node_modules 설치..." -ForegroundColor Gray
$env:PUPPETEER_SKIP_DOWNLOAD = "true"
npm install --omit=dev
$env:PUPPETEER_SKIP_DOWNLOAD = ""

# [3/4] Electron viewer 빌드 + native module 재컴파일
Write-Host "[3/4] Electron viewer build..." -ForegroundColor Cyan
Set-Location "$root\viewer"
npm install

# Electron 버전 확인
$electronVersion = node -e "console.log(require('./node_modules/electron/package.json').version)"
Write-Host "  Electron 버전: $electronVersion" -ForegroundColor Gray

# better-sqlite3, bcrypt 등 native module을 Electron Node.js ABI로 재컴파일
Write-Host "  Native module rebuild (Electron $electronVersion)..." -ForegroundColor Gray
npx @electron/rebuild --version $electronVersion --module-dir "$root\server" --types prod

Write-Host "  Electron 패키징..." -ForegroundColor Gray
npm run pack

$electronExe = Get-ChildItem "$root\viewer\dist\win-unpacked\*.exe" | Select-Object -First 1
if ($electronExe) {
  Write-Host "  Electron build done: $($electronExe.Name)"
} else {
  Write-Host "[Warning] Electron exe not found in viewer\dist\win-unpacked\" -ForegroundColor Yellow
}

# [4/4] Inno Setup installer
Write-Host "[4/4] Build installer..." -ForegroundColor Cyan
Set-Location $root

if ($innoPath) {
  if (-not (Test-Path "$root\installer")) {
    New-Item -ItemType Directory -Path "$root\installer" | Out-Null
  }
  & $innoPath "$root\setup.iss"
  Write-Host "[Done]" -ForegroundColor Green
  Write-Host "  Installer: $root\installer\RenshuSetup.exe"
} else {
  Write-Host "[Warning] Inno Setup not found. Skipping installer." -ForegroundColor Yellow
  Write-Host "  Download: https://jrsoftware.org/isinfo.php"
  Write-Host "[Done] Electron build only" -ForegroundColor Green
  Write-Host "  Viewer: $root\viewer\dist\win-unpacked\렌슈.exe"
}

Write-Host "  URL: http://localhost:3000"
Set-Location $root
