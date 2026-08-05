#!/usr/bin/env bash
# =============================================================================
# start-linux.sh — Linux 로컬 실행 (Docker 없음)
# 대상 OS: Ubuntu 22.04 / 24.04
# DB: SQLite (별도 DB 서버 불필요)
# 실행 방법: chmod +x start-linux.sh && ./start-linux.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NEED_SUDO=false
[[ $EUID -ne 0 ]] && NEED_SUDO=true
SUDO_CMD=$([[ "$NEED_SUDO" == "true" ]] && echo "sudo" || echo "")
MIGRATE_FLAG="${SCRIPT_DIR}/.migration-sqlite-done"
SOURCE_DB="${SCRIPT_DIR}/TestDB_Horilla.sqlite3"

echo ""
echo "============================================================"
echo "  Linux 로컬 실행 스크립트 (SQLite, Docker 불필요)"
echo "============================================================"
echo ""

# =============================================================================
# 1. 시스템 패키지 확인
# =============================================================================
info "[1/6] 시스템 패키지 확인..."

PKGS_NEEDED=()
for pkg in curl git build-essential python3; do
  if ! dpkg -l "$pkg" &>/dev/null; then
    PKGS_NEEDED+=("$pkg")
  fi
done

if [[ ${#PKGS_NEEDED[@]} -gt 0 ]]; then
  info "필요한 패키지 설치: ${PKGS_NEEDED[*]}"
  $SUDO_CMD apt-get update -y
  $SUDO_CMD apt-get install -y "${PKGS_NEEDED[@]}"
fi
success "시스템 패키지 확인 완료"

# =============================================================================
# 2. Node.js 24 설치
# =============================================================================
info "[2/6] Node.js 확인..."

install_node() {
  info "Node.js 24.x 설치 중 (NodeSource)..."
  curl -fsSL https://deb.nodesource.com/setup_24.x | $SUDO_CMD bash -
  $SUDO_CMD apt-get install -y nodejs
  success "Node.js $(node -v) 설치 완료"
}

if ! command -v node &>/dev/null; then
  install_node
else
  NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
  if [[ "$NODE_MAJOR" -lt 18 ]]; then
    warn "Node.js 버전이 낮습니다 ($(node -v)). Node.js 24로 업그레이드합니다."
    install_node
  else
    success "Node.js 확인: $(node -v)"
  fi
fi

# =============================================================================
# 3. npm 의존성 설치
# =============================================================================
info "[3/6] 의존성 설치..."

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
# 4. .env 파일 설정
# =============================================================================
info "[4/6] 환경변수 파일 설정..."
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
# 5. DB 마이그레이션 (TestDB_Horilla.sqlite3 → db.sqlite)
# =============================================================================
info "[5/6] DB 마이그레이션 확인..."

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
# 6. 서버 + 클라이언트 실행
# =============================================================================
info "[6/6] 서버 및 클라이언트 실행..."

if command -v tmux &>/dev/null; then
  info "tmux로 분할 화면 실행..."

  tmux kill-session -t webapp 2>/dev/null || true

  tmux new-session -d -s webapp -n "server" \
    "cd '${SCRIPT_DIR}/server' && npm run start:dev; read"
  tmux new-window -t webapp -n "client" \
    "cd '${SCRIPT_DIR}/client' && npm run dev; read"

  tmux select-window -t webapp:server

  echo ""
  success "tmux 세션 'webapp' 시작 완료"
  echo ""
  echo "  tmux 세션 접속: tmux attach -t webapp"
  echo "  창 전환       : Ctrl+B, 숫자키"
  echo "  세션 종료     : tmux kill-session -t webapp"
  echo "  마이그레이션 재실행: rm ${MIGRATE_FLAG}"

  info "서버 시작 대기 중..."
  RETRY=0
  until curl -sf http://localhost:3000 > /dev/null 2>&1 || [[ $RETRY -ge 30 ]]; do
    sleep 2
    RETRY=$((RETRY + 1))
    echo -n "."
  done
  echo ""

  tmux attach -t webapp

else
  warn "tmux가 없습니다. 백그라운드로 실행합니다."
  warn "'sudo apt-get install -y tmux' 로 설치하면 분할 화면을 사용할 수 있습니다."
  echo ""

  LOG_DIR="${SCRIPT_DIR}/.logs"
  mkdir -p "${LOG_DIR}"

  cd "${SCRIPT_DIR}/server"
  nohup npm run start:dev > "${LOG_DIR}/server.log" 2>&1 &
  SERVER_PID=$!
  echo "$SERVER_PID" > "${LOG_DIR}/server.pid"
  success "백엔드 시작 (PID: ${SERVER_PID})"

  info "서버 시작 대기 중..."
  RETRY=0
  until curl -sf http://localhost:3000 > /dev/null 2>&1 || [[ $RETRY -ge 30 ]]; do
    sleep 2
    RETRY=$((RETRY + 1))
    echo -n "."
  done
  echo ""

  cd "${SCRIPT_DIR}/client"
  nohup npm run dev > "${LOG_DIR}/client.log" 2>&1 &
  CLIENT_PID=$!
  echo "$CLIENT_PID" > "${LOG_DIR}/client.pid"
  success "프론트엔드 시작 (PID: ${CLIENT_PID})"

  xdg-open http://localhost:5173 2>/dev/null || true

  echo ""
  echo "============================================================"
  echo -e "${GREEN}  실행 완료! (백그라운드 모드)${NC}"
  echo "============================================================"
  echo ""
  echo "  백엔드  : http://localhost:3000"
  echo "  프론트  : http://localhost:5173"
  echo ""
  echo "  로그 확인:"
  echo "    tail -f ${LOG_DIR}/server.log"
  echo "    tail -f ${LOG_DIR}/client.log"
  echo ""
  echo "  종료 방법:"
  echo "    kill \$(cat ${LOG_DIR}/server.pid) \$(cat ${LOG_DIR}/client.pid)"
  echo "  마이그레이션 재실행: rm ${MIGRATE_FLAG}"
  echo ""
fi
