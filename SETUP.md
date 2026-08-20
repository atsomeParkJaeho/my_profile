# 렌슈 프로젝트 설치 및 실행 가이드

## 목차
1. [필수 프로그램 설치](#1-필수-프로그램-설치)
2. [프로젝트 패키지 설치](#2-프로젝트-패키지-설치)
3. [build.bat - 실행 파일 빌드](#3-buildbat---실행-파일-빌드)
4. [start.bat - 뷰어 실행](#4-startbat---뷰어-실행)
5. [결과물 구조](#5-결과물-구조)
6. [자주 발생하는 오류](#6-자주-발생하는-오류)

---

## 1. 필수 프로그램 설치

### 1-1. Node.js v22 이상
- 다운로드: https://nodejs.org
- 버전 확인:
```
node -v
npm -v
```

### 1-2. Google Chrome 또는 Microsoft Edge
- 검색 기능(Puppeteer)이 사용자 PC의 Chrome/Edge를 사용합니다.
- 다운로드: https://www.google.com/chrome

### 1-3. Inno Setup 6 (선택 - RenshuSetup.exe 생성 시 필요)
- 다운로드: https://jrsoftware.org/isinfo.php
- 없으면 `build.bat` 실행 시 installer 생성 단계를 건너뜁니다.
- `release\server.exe` 단독 실행은 Inno Setup 없이도 가능합니다.

---

## 2. 프로젝트 패키지 설치

`build.bat` 실행 전 **최초 1회** 반드시 진행해야 합니다.

### 2-1. client 패키지 설치
PowerShell 또는 명령 프롬프트에서:
```
cd D:\renshu\client
npm install
```

### 2-2. server 패키지 설치
```
cd D:\renshu\server
npm install
```

### 2-3. better-sqlite3 재빌드 (중요)
`npm install` 후 SQLite 네이티브 바이너리를 현재 Node.js 버전에 맞게 재빌드합니다.
```
cd D:\renshu\server
npm rebuild better-sqlite3
```
> 이 단계를 건너뛰면 서버 실행 시 `Could not locate the bindings file` 오류 발생

### 2-4. viewer 패키지 설치
```
cd D:\renshu\viewer
npm install
```

---

## 3. build.bat - 실행 파일 빌드

### 실행 방법
`D:\renshu\build.bat` 더블클릭

### 내부 실행 순서

```
[1/4] React 클라이언트 빌드
      client\ 에서 npm run build 실행
      결과: client\dist\ 생성 (HTML, JS, CSS 번들)

[2/4] NestJS 빌드 + exe 패키징
      server\ 에서 npm run build:exe 실행
        1단계 nest build   : TypeScript -> server\dist\*.js 변환
        2단계 pkg          : dist + client\dist + SQLite 바이너리를
                             하나의 server.exe로 패키징
      결과: release\server.exe 생성

[3/4] 환경설정 및 정적 파일 복사
      server\.env.dev  ->  release\.env
      client\dist\     ->  release\client\dist\
      (server.exe 실행 시 같은 폴더의 .env와 client\dist를 참조)

[4/4] 설치 프로그램 생성 (Inno Setup 설치된 경우에만)
      setup.iss 기반으로 RenshuSetup.exe 생성
      결과: installer\RenshuSetup.exe
      (Inno Setup 없으면 이 단계 건너뜀)
```

### 소요 시간
- 최초 빌드: 약 3~10분 (네트워크 속도에 따라 다름)
- 이후 빌드: 약 1~3분

### 빌드 완료 후 생성되는 파일
```
D:\renshu\
├── release\
│   ├── server.exe          <- 단독 실행 가능한 서버
│   ├── .env                <- 환경설정 (.env.dev 복사본)
│   └── client\
│       └── dist\           <- React 정적 파일
└── installer\
    └── RenshuSetup.exe     <- 설치 프로그램 (Inno Setup 있는 경우)
```

---

## 4. start.bat - 뷰어 실행

### 실행 방법
`D:\renshu\start.bat` 더블클릭

### 사전 조건
- `build.bat` 실행 완료 (`release\server.exe` 존재해야 함)
- `viewer\node_modules` 존재 (`npm install` 완료 상태)

### 내부 실행 순서

```
start.bat 더블클릭
  -> viewer\ 폴더에서 npm start 실행
  -> Electron 앱 시작
       1. release\server.exe 백그라운드 실행 (콘솔 창 없음)
       2. localhost:3000 응답 대기 (0.5초 간격, 최대 10초)
       3. 서버 준비 완료 -> Electron 창 열림
       4. http://localhost:3000 자동 접속
  -> 창 닫으면 server.exe도 함께 종료
```

### 실행 화면
- 브라우저 없이 독립 앱 창으로 실행됩니다.
- 상단 메뉴바는 숨겨져 있습니다.
- 외부 링크 클릭 시 기본 브라우저에서 열립니다.

---

## 5. 결과물 구조

```
D:\renshu\
├── build.bat               <- 빌드 실행 (더블클릭)
├── start.bat               <- 뷰어 실행 (더블클릭)
├── build-exe.ps1           <- 빌드 스크립트 본체
├── setup.iss               <- Inno Setup 설치 스크립트
│
├── client\                 <- React 프론트엔드 소스
├── server\                 <- NestJS 백엔드 소스
│   └── .env.dev            <- 개발/빌드용 환경설정
│
├── viewer\                 <- Electron 뷰어
│   ├── main.js
│   └── package.json
│
├── release\                <- 빌드 결과물 (build.bat 실행 후 생성)
│   ├── server.exe
│   ├── .env
│   └── client\dist\
│
└── installer\              <- 설치 프로그램 (Inno Setup 있는 경우)
    └── RenshuSetup.exe
```

---

## 6. 자주 발생하는 오류

### Could not locate the bindings file (better-sqlite3)
```
원인: SQLite 네이티브 바이너리가 없거나 Node.js 버전 불일치
해결: cd D:\renshu\server && npm rebuild better-sqlite3
```

### EADDRINUSE: address already in use 3000
```
원인: 이전에 실행한 서버가 아직 살아있음
해결: PowerShell에서 아래 명령 실행
(Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess | ForEach-Object { taskkill /PID $_ /F }
```

### Cannot GET / (404)
```
원인: release\client\dist 폴더가 없음
해결: build.bat 재실행 (3단계에서 자동 복사됨)
```

### Property 'bin' does not exist (pkg 오류)
```
원인: server\package.json에 bin 항목 누락
현재 상태: 이미 수정 완료 ("bin": "dist/main.js")
```

### No native build was found (bcrypt)
```
원인: bcrypt 바이너리가 pkg assets에 포함 안 됨
현재 상태: 이미 수정 완료 (package.json assets에 추가됨)
```

### Chrome을 찾을 수 없습니다 (검색 기능 오류)
```
원인: Google Chrome 또는 Microsoft Edge 미설치
해결: https://www.google.com/chrome 에서 Chrome 설치
```

### pkg cache 오류 (NODE_MODULE_VERSION 불일치)
```
원인: pkg 캐시에 이전 버전 Node 바이너리가 남아있음
해결: PowerShell에서 아래 명령 실행 후 build.bat 재실행
Remove-Item "$env:USERPROFILE\.cache\pkg" -Recurse -Force
```
