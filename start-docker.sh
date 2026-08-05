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
# .env.prod 에서 관리자 계정 환경변수 로드
# =============================================================================
ENV_PROD="${SCRIPT_DIR}/server/.env.prod"
if [[ -f "${ENV_PROD}" ]]; then
  export $(grep -E '^(ADMIN_EMAIL|ADMIN_NAME|ADMIN_PASSWORD)=' "${ENV_PROD}" | xargs)
  success ".env.prod 관리자 계정 로드 완료"
else
  warn ".env.prod 파일이 없습니다. 관리자 계정이 생성되지 않을 수 있습니다."
fi

# =============================================================================
# Docker Compose 빌드 및 실행
# =============================================================================
cd "${SCRIPT_DIR}"

info "기존 컨테이너 및 PostgreSQL 볼륨 삭제..."
docker compose down -v 2>/dev/null || true

info "Docker 이미지 빌드 및 컨테이너 시작..."
docker compose up --build -d

# PostgreSQL 헬스체크 대기
info "PostgreSQL 준비 대기 중..."
RETRY=0
until docker compose exec -T db pg_isready -U appuser -d appdb &>/dev/null || [[ $RETRY -ge 30 ]]; do
  sleep 3
  RETRY=$((RETRY + 1))
  echo -n "."
done
echo ""

# =============================================================================
# DB 마이그레이션 섹션 제거 (PostgreSQL은 TypeORM synchronize로 자동 처리)

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
echo "  PostgreSQL : localhost:5432 (user: appuser / pass: apppass)"
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
