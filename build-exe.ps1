# exe 빌드 스크립트
# 실행: .\build-exe.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "`n[1/3] React 클라이언트 빌드..." -ForegroundColor Cyan
Set-Location "$root\client"
npm run build

Write-Host "`n[2/3] NestJS 서버 빌드 + exe 패키징..." -ForegroundColor Cyan
Set-Location "$root\server"
npm run build:exe

Write-Host "`n[3/3] 완료!" -ForegroundColor Green
Write-Host "실행 파일 위치: $root\release\server.exe"
Write-Host "실행 방법: .\release\server.exe"
Write-Host "접속 주소: http://localhost:3000"

Set-Location $root
