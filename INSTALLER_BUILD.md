# React + NestJS + Electron → 인스톨러 변환 가이드

## 전체 아키텍처 개요

```
사용자 PC에서 실제로 실행되는 것

렌슈.exe (Electron)
 ├── 내부 Chromium 브라우저 (화면 렌더링)
 └── server.exe 자동 실행 → localhost:3000
      ├── NestJS 서버 (Node.js 런타임 내장)
      └── React 빌드 파일 서빙 (client/dist/)
```

**핵심 아이디어**: 웹앱(React+NestJS)을 그대로 두고, Electron이 브라우저 창 역할을 하며 백엔드 서버를 자동으로 켜줌

---

## 사전 준비 (빌드 머신에만 필요)

| 항목 | 비고 |
|------|------|
| Node.js v20 이상 | https://nodejs.org |
| Inno Setup 6 | https://jrsoftware.org/isinfo.php |

---

## 단계별 상세 과정

### STEP 1 — React 클라이언트 빌드

**목적**: JSX/TS 소스 → 정적 HTML/CSS/JS 파일로 변환

```
client/src/  →  (Vite 빌드)  →  client/dist/
```

```powershell
cd client
npm run build
# 결과: client/dist/ 폴더 생성
```

NestJS가 `client/dist/` 폴더를 정적 파일로 서빙함. 소스 파일(.tsx)은 브라우저가 직접 읽을 수 없으므로 반드시 빌드 필요.

---

### STEP 2 — NestJS → server.exe 패키징

**목적**: Node.js 없이도 실행되는 단일 .exe 파일 생성

```
server/src/ (TypeScript)
    ↓ nest build (tsc 컴파일)
server/dist/ (JavaScript)
    ↓ pkg 패키징 (Node.js 런타임 내장)
release/server.exe (단일 실행파일, ~80MB)
```

```powershell
cd server
npm run build:exe
# 내부적으로: nest build && pkg . --compress GZip
# 결과: release/server.exe 생성
```

**pkg가 하는 일**:
- Node.js 런타임 자체를 exe 안에 내장
- `dist/**/*.js`, `better-sqlite3.node`, `bcrypt.node` 등 네이티브 모듈 포함
- `client/dist/` 정적 파일도 함께 번들

`server/package.json`의 pkg 설정:
```json
"pkg": {
  "assets": [
    "dist/**/*",
    "../client/dist/**/*",
    "node_modules/better-sqlite3/build/Release/better_sqlite3.node",
    "node_modules/bcrypt/prebuilds/win32-x64/bcrypt.node"
  ],
  "targets": ["node24-win-x64"],
  "outputPath": "../release"
}
```

---

### STEP 3 — release 폴더 정리

**목적**: 배포에 필요한 파일을 한 곳에 모음

```powershell
# .env.dev → release/.env 로 복사 (DB경로, 시크릿 키 등 설정값)
Copy-Item server\.env.dev release\.env

# React 빌드 결과물 복사
Copy-Item client\dist release\client\dist -Recurse
```

`release/` 폴더 상태:
```
release/
├── server.exe    ← NestJS + Node.js 런타임 내장
├── .env          ← 환경설정 (DB 경로, 포트 등)
└── client/
    └── dist/     ← React 빌드 결과물 (server.exe가 서빙)
```

---

### STEP 4 — Electron viewer 빌드

**목적**: Electron을 단일 실행파일 형태로 패키징

```
viewer/main.js (Electron 앱 코드)
    ↓ electron-builder --dir --win
viewer/dist/win-unpacked/
    ├── 렌슈.exe          ← 실행 진입점
    ├── resources/        ← app.asar (main.js 번들)
    └── (Chromium 런타임 파일들, ~200MB)
```

```powershell
cd viewer
npm install
npm run pack    # electron-builder --dir --win
```

`viewer/package.json`의 electron-builder 설정:
```json
"build": {
  "appId": "com.renshu.viewer",
  "productName": "렌슈",
  "win": { "target": "dir" },
  "files": ["main.js"]
}
```

**`main.js`가 하는 일** (설치 후 실행 시):
```javascript
// 1. server.exe 위치 결정 (렌슈.exe 옆에 있는 server.exe)
const serverExe = path.join(path.dirname(process.execPath), 'server.exe');

// 2. server.exe 백그라운드 실행
spawn(serverExe, [], { windowsHide: true });

// 3. localhost:3000 응답 올 때까지 폴링 (500ms 간격, 최대 20회)
waitAndOpen();

// 4. 응답 오면 Electron 창에 localhost:3000 로드
win.loadURL('http://localhost:3000');
```

---

### STEP 5 — Inno Setup으로 인스톨러 생성

**목적**: 위 파일들을 하나의 `RenshuSetup.exe`로 압축 패키징

`setup.iss` 핵심 설정:

```ini
[Files]
; ① 백엔드 서버
Source: "release\server.exe"           → {app}\server.exe

; ② Electron 뷰어 전체 (Chromium 포함, ~200MB)
Source: "viewer\dist\win-unpacked\*"   → {app}\(모든 파일)

; ③ React 정적 파일
Source: "release\client\dist\*"        → {app}\client\dist\

; ④ 환경설정
Source: "release\.env"                 → {app}\.env

[Icons]
; 바탕화면 바로가기 → 렌슈.exe 실행
Name: "{userdesktop}\렌슈"; Filename: "{app}\렌슈.exe"

[Run]
; 설치 완료 후 자동 실행
Filename: "{app}\렌슈.exe"; Flags: postinstall nowait
```

```powershell
ISCC.exe setup.iss
# 결과: installer/RenshuSetup.exe
```

---

## 전체 파일 흐름 요약

```
[소스코드]                    [빌드 결과]              [인스톨러]

client/src/          →  client/dist/           ↘
  (React TSX)           (HTML/CSS/JS)

server/src/          →  release/server.exe     →  setup.iss  →  installer/RenshuSetup.exe
  (NestJS TS)           (Node.js 내장 exe)        (Inno Setup)

viewer/main.js       →  viewer/dist/           ↗
  (Electron JS)         win-unpacked/렌슈.exe
                        (Chromium 내장)
```

---

## 설치 후 사용자 PC 폴더 구조

```
C:\Program Files\Renshu\  (또는 사용자 선택 경로)
├── 렌슈.exe               ← 더블클릭으로 실행
├── server.exe             ← 렌슈.exe가 자동으로 실행
├── .env                   ← DB 설정
├── client/
│   └── dist/              ← React 화면
├── resources/             ← Electron 앱 코드
└── (Chromium 런타임 파일들)
```

---

## 빌드 전체 명령어 (1회 실행)

```powershell
# 프로젝트 루트에서 실행
.\build-exe.ps1

# 빌드 순서:
# [1/5] React 빌드
# [2/5] NestJS → server.exe
# [3/5] 파일 복사 (release 폴더 정리)
# [4/5] Electron → 렌슈.exe
# [5/5] Inno Setup → RenshuSetup.exe

# 최종 결과물
#   installer\RenshuSetup.exe  ← 배포용 인스톨러
#   release\server.exe         ← 백엔드 단독 실행파일
#   release\렌슈.exe            ← viewer 단독 실행파일
```

---

## 배포 방법

| 상황 | 방법 |
|------|------|
| 다른 PC에 배포 | `RenshuSetup.exe` 하나만 전달 → 더블클릭 설치 |
| 테스트/임시 실행 | `release\` 폴더 통째로 복사 → `렌슈.exe` 실행 |

### 대상 PC 요구사항

- Windows 10/11 (x64)
- Node.js, npm 불필요 (server.exe에 Node.js 런타임 내장)
- 가격 검색 기능 사용 시 Chrome 또는 Edge 필요
