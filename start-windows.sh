#!/usr/bin/env bash
# =============================================================================
# start-windows.sh — Windows 로컬 실행 (Docker 없음, Git Bash 필요)
# DB: SQLite (별도 DB 서버 불필요)
# 실행 방법: Git Bash에서 ./start-windows.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATE_FLAG="${SCRIPT_DIR}/.migration-sqlite-done"
SOURCE_DB="${SCRIPT_DIR}/TestDB_Horilla.sqlite3"

echo ""
echo "============================================================"
echo "  Windows 로컬 실행 스크립트 (SQLite, Docker 불필요)"
echo "============================================================"
echo ""

# =============================================================================
# 1. Node.js 설치 확인 및 설치
# =============================================================================
install_node_windows() {
  info "Node.js 24 설치 시도 (winget)..."

  if command -v winget &>/dev/null; then
    winget install OpenJS.NodeJS.LTS --version 24 --accept-source-agreements --accept-package-agreements || \
    winget install OpenJS.NodeJS --accept-source-agreements --accept-package-agreements || true
    warn "설치 후 Git Bash를 재시작하고 이 스크립트를 다시 실행하세요."
    exit 0
  fi

  if command -v choco &>/dev/null; then
    info "Chocolatey로 Node.js 설치..."
    choco install nodejs-lts -y
    warn "설치 후 Git Bash를 재시작하고 이 스크립트를 다시 실행하세요."
    exit 0
  fi

  error "Node.js를 설치할 수 없습니다.\n\
  https://nodejs.org/en/download 에서 Node.js 24를 수동으로 설치하세요.\n\
  설치 후 Git Bash를 재시작하고 이 스크립트를 다시 실행하세요."
}

info "[1/5] Node.js 확인..."
if ! command -v node &>/dev/null; then
  warn "Node.js가 설치되어 있지 않습니다."
  install_node_windows
else
  NODE_VER=$(node -v)
  success "Node.js 확인: ${NODE_VER}"
  NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v\([0-9]*\).*/\1/')
  if [[ "$NODE_MAJOR" -lt 18 ]]; then
    warn "Node.js 18 이상을 권장합니다. 현재: ${NODE_VER}"
  fi
fi

# =============================================================================
# 2. npm 의존성 설치
# =============================================================================
info "[2/5] 의존성 설치..."

if [[ -d "${SCRIPT_DIR}/client" ]]; then
  info "client 패키지 설치..."
  cd "${SCRIPT_DIR}/client"
  npm install
  success "client 설치 완료"
fi

if [[ -d "${SCRIPT_DIR}/server" ]]; then
  info "server 패키지 설치..."
  cd "${SCRIPT_DIR}/server"
  npm install
  success "server 설치 완료"
fi

# =============================================================================
# 3. .env 파일 설정
# =============================================================================
info "[3/5] 환경변수 파일 설정..."
cd "${SCRIPT_DIR}/server"

if [[ ! -f ".env.dev" ]]; then
  cat > ".env.dev" <<'EOF'
NODE_ENV=development
PORT=3000
SESSION_SECRET=dev_session_secret_must_be_32chars!
COOKIE_SECURE=false
SESSION_DB_PATH=sessions.sqlite
DB_PATH=db.sqlite
EOF
  success ".env.dev 생성 완료"
fi

cp ".env.dev" ".env"
success ".env 설정 완료 (SQLite 모드)"

# =============================================================================
# 4. DB 마이그레이션 (TestDB_Horilla.sqlite3 → db.sqlite)
# =============================================================================
info "[4/5] DB 마이그레이션 확인..."

if [[ -f "${SOURCE_DB}" ]]; then
  if [[ -f "${MIGRATE_FLAG}" ]]; then
    warn "SQLite 마이그레이션 이미 완료됨. 건너뜁니다."
    warn "(재실행하려면 ${MIGRATE_FLAG} 파일을 삭제하세요)"
  else
    info "DB 마이그레이션 시작 (TestDB_Horilla.sqlite3 → db.sqlite)..."
    cd "${SCRIPT_DIR}"
    node migrate-to-sqlite.js
    touch "${MIGRATE_FLAG}"
    success "SQLite 마이그레이션 완료"
  fi
else
  warn "TestDB_Horilla.sqlite3 파일이 없습니다. 마이그레이션 건너뜁니다."
fi

# =============================================================================
# 5. 서버 + 클라이언트 실행 (각각 새 Git Bash 창)
# =============================================================================
info "[5/5] 서버 및 클라이언트 실행..."

SERVER_DIR="${SCRIPT_DIR}/server"
CLIENT_DIR="${SCRIPT_DIR}/client"

if command -v mintty &>/dev/null; then
  mintty --title "NestJS Server" -e bash -lc "cd '${SERVER_DIR}' && npm run start:dev; echo '서버가 종료되었습니다. 창을 닫아주세요.'; read" &
  sleep 2
  mintty --title "Vite Client" -e bash -lc "cd '${CLIENT_DIR}' && npm run dev; echo '클라이언트가 종료되었습니다. 창을 닫아주세요.'; read" &
elif command -v start &>/dev/null; then
  start bash -c "cd '${SERVER_DIR}' && npm run start:dev; read"
  sleep 2
  start bash -c "cd '${CLIENT_DIR}' && npm run dev; read"
else
  warn "새 창을 열 수 없습니다. 현재 창에서 백그라운드로 실행합니다."
  cd "${SERVER_DIR}" && npm run start:dev &
  SERVER_PID=$!
  sleep 3
  cd "${CLIENT_DIR}" && npm run dev &
  CLIENT_PID=$!

  trap 'echo "종료 중..."; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit 0' INT TERM

  echo ""
  echo "============================================================"
  echo -e "${GREEN}  실행 중! (Ctrl+C 로 종료)${NC}"
  echo "============================================================"
  echo "  백엔드  : http://localhost:3000"
  echo "  프론트  : http://localhost:5173"
  echo ""
  wait
  exit 0
fi

info "서버 시작 대기 중..."
RETRY=0
until curl -sf http://localhost:3000 > /dev/null 2>&1 || [[ $RETRY -ge 20 ]]; do
  sleep 2
  RETRY=$((RETRY + 1))
  echo -n "."
done
echo ""

start http://localhost:5173 2>/dev/null || start http://localhost:3000 2>/dev/null || true

echo ""
echo "============================================================"
echo -e "${GREEN}  실행 완료!${NC}"
echo "============================================================"
echo ""
echo "  백엔드  : http://localhost:3000"
echo "  프론트  : http://localhost:5173  ← 개발 서버 (HMR 지원)"
echo ""
echo "  마이그레이션 재실행: rm ${MIGRATE_FLAG}"
echo "  종료 방법: 각 터미널 창에서 Ctrl+C"
echo ""
