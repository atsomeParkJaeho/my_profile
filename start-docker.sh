#!/usr/bin/env bash
# =============================================================================
# start-docker.sh — Docker로 웹 애플리케이션 실행 (Windows WSL/Git Bash + Linux)
# 실행 방법: chmod +x start-docker.sh && ./start-docker.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATE_FLAG="${SCRIPT_DIR}/.migration-mariadb-done"
SOURCE_DB="${SCRIPT_DIR}/TestDB_Horilla.sqlite3"

# ── OS 감지 ──────────────────────────────────────────────────────────────────
detect_os() {
  case "$OSTYPE" in
    msys*|cygwin*|mingw*) echo "windows" ;;
    linux-gnu*)           echo "linux"   ;;
    darwin*)              echo "mac"     ;;
    *)                    echo "unknown" ;;
  esac
}
OS=$(detect_os)

echo ""
echo "============================================================"
echo "  Docker 실행 스크립트"
echo "  OS: ${OS}"
echo "============================================================"
echo ""

# =============================================================================
# Docker 설치 확인 및 설치 (Linux만 자동 설치)
# =============================================================================
install_docker_linux() {
  info "Docker 설치 중..."
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg lsb-release

  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin

  sudo systemctl enable docker
  sudo systemctl start docker
  sudo usermod -aG docker "${USER}" || true
  success "Docker 설치 완료"
}

if ! command -v docker &>/dev/null; then
  if [[ "$OS" == "linux" ]]; then
    install_docker_linux
  elif [[ "$OS" == "windows" ]]; then
    error "Docker Desktop이 설치되어 있지 않습니다.\n\
  Windows에서는 Docker Desktop을 수동으로 설치하세요:\n\
  https://www.docker.com/products/docker-desktop\n\
  설치 후 Docker Desktop을 실행한 뒤 이 스크립트를 다시 실행하세요."
  else
    error "Docker가 설치되어 있지 않습니다."
  fi
else
  success "Docker 확인: $(docker --version)"
fi

# Docker Compose 확인
if ! docker compose version &>/dev/null; then
  error "Docker Compose plugin이 없습니다. Docker Desktop을 최신 버전으로 업데이트하세요."
fi
success "Docker Compose 확인: $(docker compose version)"

# Docker 데몬 실행 확인
if ! docker info &>/dev/null; then
  if [[ "$OS" == "windows" ]]; then
    error "Docker Desktop이 실행 중이지 않습니다. Docker Desktop을 시작한 후 다시 실행하세요."
  else
    error "Docker 데몬이 실행 중이지 않습니다. 'sudo systemctl start docker' 를 실행하세요."
  fi
fi

# =============================================================================
# Docker Compose 빌드 및 실행
# =============================================================================
cd "${SCRIPT_DIR}"

info "기존 컨테이너 및 MariaDB 볼륨 삭제..."
docker compose down -v 2>/dev/null || true

info "Docker 이미지 빌드 및 컨테이너 시작..."
docker compose up --build -d

# MariaDB 헬스체크 대기
info "MariaDB 준비 대기 중..."
RETRY=0
until docker compose exec -T db mariadb -u appuser -papppass appdb -e "SELECT 1" &>/dev/null || [[ $RETRY -ge 30 ]]; do
  sleep 3
  RETRY=$((RETRY + 1))
  echo -n "."
done
echo ""

# =============================================================================
# DB 마이그레이션 (TestDB_Horilla.sqlite3 → MariaDB)
# =============================================================================
if [[ -f "${SOURCE_DB}" ]]; then
  info "DB 마이그레이션 시작 (TestDB_Horilla.sqlite3 → MariaDB)..."
  cd "${SCRIPT_DIR}"

  if ! command -v node &>/dev/null; then
    warn "Node.js가 없어 마이그레이션을 건너뜁니다."
  else
    # server npm 의존성 확인
    if [[ ! -d "${SCRIPT_DIR}/server/node_modules" ]]; then
      info "server 의존성 설치 중..."
      cd "${SCRIPT_DIR}/server" && npm install --silent
      cd "${SCRIPT_DIR}"
    fi

    DB_HOST=localhost \
    DB_PORT=3306 \
    DB_USER=appuser \
    DB_PASS=apppass \
    DB_NAME=appdb \
    node "${SCRIPT_DIR}/migrate-to-mariadb.js"

    success "MariaDB 마이그레이션 완료"
  fi
else
  warn "TestDB_Horilla.sqlite3 파일이 없습니다. 마이그레이션 건너뜁니다."
fi

# 앱 서버 시작 대기
info "앱 서버 시작 대기 중..."
RETRY=0
until curl -sf http://localhost:3000/api/auth/me > /dev/null 2>&1 || [[ $RETRY -ge 30 ]]; do
  sleep 2
  RETRY=$((RETRY + 1))
  echo -n "."
done
echo ""

echo ""
echo "============================================================"
echo -e "${GREEN}  실행 완료!${NC}"
echo "============================================================"
echo ""
echo "  접속 주소  : http://localhost:3000"
echo "  MariaDB    : localhost:3306 (user: appuser / pass: apppass)"
echo ""
echo "  로그 확인  : docker compose logs -f app"
echo "  종료       : docker compose down"
echo ""

# 브라우저 자동 오픈 (OS별)
if [[ "$OS" == "windows" ]]; then
  start http://localhost:3000 2>/dev/null || true
elif [[ "$OS" == "linux" ]]; then
  xdg-open http://localhost:3000 2>/dev/null || true
elif [[ "$OS" == "mac" ]]; then
  open http://localhost:3000 2>/dev/null || true
fi
