const { app, BrowserWindow, shell, utilityProcess } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

const SERVER_PORT = 3000;
const SERVER_URL  = `http://localhost:${SERVER_PORT}`;

const isPackaged = app.isPackaged;

// 패키징 후: resources/server/dist/main.js
// 개발 중:   ../server/dist/main.js
const serverScript = isPackaged
  ? path.join(process.resourcesPath, 'server', 'dist', 'main.js')
  : path.join(__dirname, '..', 'server', 'dist', 'main.js');

const serverDir = isPackaged
  ? path.join(process.resourcesPath, 'server')
  : path.join(__dirname, '..', 'server');

let win        = null;
let serverProc = null;

// ── server 기동 (utilityProcess — server.exe 없음, 백신 탐지 없음) ───────────
function startServer() {
  const userData = app.getPath('userData'); // %APPDATA%\렌슈
  if (!fs.existsSync(userData)) fs.mkdirSync(userData, { recursive: true });

  serverProc = utilityProcess.fork(serverScript, [], {
    cwd: serverDir,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(SERVER_PORT),
      // DB / 세션 파일은 사용자 AppData에 저장 (설치 폴더 쓰기 권한 불필요)
      DB_PATH: path.join(userData, 'app.sqlite'),
      SESSION_DB_PATH: path.join(userData, 'sessions.sqlite'),
      SESSION_SECRET: 'renshu_prod_secret_must_be_32chars!',
      COOKIE_SECURE: 'false',
      ADMIN_EMAIL: 'admin@renshu.com',
      ADMIN_NAME: '관리자',
      ADMIN_PASSWORD: '123456',
    },
    stdio: 'inherit',
  });
}

// ── 서버 준비될 때까지 폴링 후 창 열기 (최대 20초 대기) ──────────────────────
function waitAndOpen(retries = 40) {
  http.get(SERVER_URL, () => {
    createWindow();
  }).on('error', () => {
    if (retries <= 0) {
      console.error('서버 시작 실패');
      app.quit();
      return;
    }
    setTimeout(() => waitAndOpen(retries - 1), 500);
  });
}

// ── Electron 창 생성 ─────────────────────────────────────────────────────────
function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: '렌슈',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL(SERVER_URL);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.on('closed', () => { win = null; });
}

// ── 앱 생명주기 ──────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  startServer();
  waitAndOpen();
});

app.on('window-all-closed', () => {
  if (serverProc) serverProc.kill();
  app.quit();
});

app.on('activate', () => {
  if (win === null) createWindow();
});
