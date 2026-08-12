#!/usr/bin/env bash
# =============================================================================
# setup.sh — Ubuntu 환경 초기 세팅 스크립트
# 대상 OS : Ubuntu 22.04 / 24.04
# 실행 방법: chmod +x setup.sh && sudo ./setup.sh
# =============================================================================

set -euo pipefail

# ── 색상 출력 헬퍼 ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── root 여부 확인 ─────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  error "이 스크립트는 root 권한이 필요합니다. sudo ./setup.sh 로 실행하세요."
fi

# ── 실행 사용자 저장 (sudo 실행 시 원래 사용자 파악) ──────────────────────────
REAL_USER="${SUDO_USER:-$USER}"

echo ""
echo "============================================================"
echo "  프로젝트 환경 설치 스크립트 (Ubuntu)"
echo "============================================================"
echo ""

# =============================================================================
# 1. 시스템 패키지 업데이트
# =============================================================================
info "[1/6] 시스템 패키지 업데이트..."
apt-get update -y
apt-get install -y \
  curl \
  wget \
  git \
  ca-certificates \
  gnupg \
  lsb-release \
  build-essential \
  python3
success "시스템 패키지 설치 완료"

# =============================================================================
# 2. Node.js 24.x 설치 (NodeSource)
# =============================================================================
info "[2/6] Node.js 24.x 설치..."

if command -v node &>/dev/null; then
  warn "Node.js 이미 설치됨: $(node -v)"
else
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
  success "Node.js $(node -v) 설치 완료"
fi

# =============================================================================
# 3. Docker 설치
# =============================================================================
info "[3/6] Docker 설치..."

if command -v docker &>/dev/null; then
  warn "Docker 이미 설치됨: $(docker --version)"
else
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -y
  apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

  usermod -aG docker "${REAL_USER}"
  systemctl enable docker
  systemctl start docker

  success "Docker $(docker --version) 설치 완료"
  warn "docker 그룹 적용을 위해 로그아웃 후 재로그인이 필요합니다."
fi

# =============================================================================
# 4. npm 의존성 설치 (client + server)
# =============================================================================
info "[4/6] npm 의존성 설치..."

if [[ -d "${SCRIPT_DIR}/client" ]]; then
  sudo -u "${REAL_USER}" bash -c "cd '${SCRIPT_DIR}/client' && npm install"
  success "client npm install 완료"
else
  warn "client 디렉토리를 찾을 수 없습니다. 건너뜁니다."
fi

if [[ -d "${SCRIPT_DIR}/server" ]]; then
  sudo -u "${REAL_USER}" bash -c "cd '${SCRIPT_DIR}/server' && npm install"
  success "server npm install 완료"
else
  warn "server 디렉토리를 찾을 수 없습니다. 건너뜁니다."
fi

# ── Puppeteer Chromium 의존 라이브러리 설치 (가격비교 크롤링용) ────────────────
info "[4-1] Puppeteer Chromium 시스템 의존성 설치..."
apt-get install -y \
  libgbm-dev \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libglib2.0-0 \
  libasound2 \
  libpangocairo-1.0-0 \
  libx11-xcb1 \
  libxcb-dri3-0 \
  fonts-liberation \
  xdg-utils
success "Chromium 의존성 설치 완료"

# =============================================================================
# 5. 실행 모드 선택
# =============================================================================
info "[5/6] 실행 모드를 선택하세요."
echo ""
echo "  1) Docker   — MariaDB + NestJS 컨테이너 (.env.prod 적용)"
echo "  2) 개발     — 로컬 SQLite + Vite HMR (.env.dev 적용)"
echo "  3) 설치만   — .env 파일만 생성하고 종료"
echo ""
read -rp "선택 [1/2/3]: " MODE_CHOICE

# =============================================================================
# 6. .env 파일 생성 및 실행
# =============================================================================
info "[6/6] 환경 설정 및 실행..."

SERVER_DIR="${SCRIPT_DIR}/server"
ENV_DEV="${SERVER_DIR}/.env.dev"
ENV_PROD="${SERVER_DIR}/.env.prod"
ENV_TARGET="${SERVER_DIR}/.env"

# ── .env.dev 없으면 생성 ──────────────────────────────────────────────────────
if [[ ! -f "${ENV_DEV}" ]]; then
  info ".env.dev 파일 생성..."
  cat > "${ENV_DEV}" <<'EOF'
# ────────────────────────────────────────
# 개발 환경 (development)
# DB: SQLite (DB_HOST 미설정 시 자동 사용)
# ────────────────────────────────────────

NODE_ENV=development
PORT=3000

# SQLite — DB_HOST를 비워두면 자동으로 SQLite 사용
DB_PATH=db.sqlite

# MariaDB 사용 시 아래 주석 해제
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=appuser
# DB_PASS=apppass
# DB_NAME=appdb
EOF
  chown "${REAL_USER}:${REAL_USER}" "${ENV_DEV}"
  success ".env.dev 생성 완료"
else
  warn ".env.dev 이미 존재합니다. 건너뜁니다."
fi

# ── .env.prod 없으면 생성 ─────────────────────────────────────────────────────
if [[ ! -f "${ENV_PROD}" ]]; then
  info ".env.prod 파일 생성..."
  cat > "${ENV_PROD}" <<'EOF'
# ────────────────────────────────────────
# 운영 환경 (production)
# DB: MariaDB (Docker Compose 기준)
# ────────────────────────────────────────

NODE_ENV=production
PORT=3000

# MariaDB 연결 정보 (docker-compose.yml의 db 서비스와 일치)
DB_HOST=db
DB_PORT=3306
DB_USER=appuser
DB_PASS=apppass
DB_NAME=appdb
EOF
  chown "${REAL_USER}:${REAL_USER}" "${ENV_PROD}"
  success ".env.prod 생성 완료"
else
  warn ".env.prod 이미 존재합니다. 건너뜁니다."
fi

# ── 모드에 따른 .env 복사 및 실행 ─────────────────────────────────────────────
case "${MODE_CHOICE}" in
  1)
    info ".env.prod → .env 복사 (Docker / MariaDB 모드)..."
    cp "${ENV_PROD}" "${ENV_TARGET}"
    chown "${REAL_USER}:${REAL_USER}" "${ENV_TARGET}"
    success ".env 설정 완료 (production / MariaDB)"

    info "Docker Compose로 빌드 및 실행..."
    cd "${SCRIPT_DIR}"
    sudo -u "${REAL_USER}" docker compose up --build -d

    echo ""
    success "컨테이너 실행 완료!"
    echo ""
    echo "  앱 접속    : http://localhost:3000"
    echo "  MariaDB    : localhost:3306"
    echo "               user: appuser / pass: apppass / db: appdb"
    echo ""
    echo "  로그 확인  : docker compose logs -f app"
    echo "  종료       : docker compose down"
    ;;

  2)
    info ".env.dev → .env 복사 (개발 / SQLite 모드)..."
    cp "${ENV_DEV}" "${ENV_TARGET}"
    chown "${REAL_USER}:${REAL_USER}" "${ENV_TARGET}"
    success ".env 설정 완료 (development / SQLite)"

    echo ""
    warn "터미널 2개에서 각각 실행하세요:"
    echo ""
    echo "  # 터미널 1 — 백엔드 (포트 3000)"
    echo "  cd ${SERVER_DIR} && npm run start:dev"
    echo ""
    echo "  # 터미널 2 — 프론트엔드 (포트 5173)"
    echo "  cd ${SCRIPT_DIR}/client && npm run dev"
    echo ""
    echo "  적용된 .env:"
    echo "    NODE_ENV : development"
    echo "    DB       : SQLite (db.sqlite)"
    echo "    PORT     : 3000"
    ;;

  3)
    info ".env 파일만 생성하고 종료합니다."
    echo ""
    echo "  생성된 파일:"
    echo "    ${ENV_DEV}"
    echo "    ${ENV_PROD}"
    echo ""
    echo "  사용 방법:"
    echo "    Docker 실행  : cp server/.env.prod server/.env && docker compose up --build -d"
    echo "    개발 실행    : cp server/.env.dev server/.env && cd server && npm run start:dev"
    ;;

  *)
    warn "잘못된 선택입니다. .env 파일만 생성하고 종료합니다."
    ;;
esac

# =============================================================================
# 완료 메시지
# =============================================================================
echo ""
echo "============================================================"
echo -e "${GREEN}  설치 완료!${NC}"
echo "============================================================"
echo ""
echo "  .env 파일 위치 : server/.env"
echo ""
echo "  환경 전환 방법:"
echo "    Docker(prod) : cp server/.env.prod server/.env"
echo "    개발(dev)    : cp server/.env.dev  server/.env"
echo ""
echo "  주요 명령어:"
echo "    Docker 실행    : docker compose up --build -d"
echo "    Docker 종료    : docker compose down"
echo "    백엔드 개발    : cd server && npm run start:dev"
echo "    프론트 개발    : cd client && npm run dev"
echo ""
