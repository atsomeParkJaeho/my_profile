const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const SERVER_PORT = 3000;
const SERVER_URL  = `http://localhost:${SERVER_PORT}`;

// server.exe 경로
// - 개발(npm start): viewer/../release/server.exe
// - 패키징 후 설치: 렌슈.exe 옆의 server.exe
const isPackaged = app.isPackaged;
const serverExe = isPackaged
  ? path.join(path.dirname(process.execPath), 'server.exe')
  : path.join(__dirname, '..', 'release', 'server.exe');

let win        = null;
let serverProc = null;

// ── server.exe 기동 ──────────────────────────────────────────────────────────
function startServer() {
  serverProc = spawn(serverExe, [], {
    cwd: path.dirname(serverExe),
    detached: false,
    windowsHide: true,   // 콘솔 창 숨김
  });

  serverProc.stdout.on('data', (d) => console.log('[server]', d.toString()));
  serverProc.stderr.on('data', (d) => console.error('[server]', d.toString()));
}

// ── 서버 준비될 때까지 폴링 후 창 열기 ──────────────────────────────────────
function waitAndOpen(retries = 20) {
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
    autoHideMenuBar: true,   // 상단 메뉴바 숨김
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL(SERVER_URL);

  // 외부 링크는 기본 브라우저로 열기
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
