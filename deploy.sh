#!/bin/bash
# ============================================================
#  deploy.sh — Ubuntu 24.04 배포 스크립트
#  서버 스펙: RAM 2GB / SSD 40GB / 트래픽 500GB
#  구성: Node.js + NestJS(Fastify) + React(Vite) + MariaDB + PM2 + Nginx
# ============================================================
set -e

# ────────────────────────────────────────────────────────────
# 0. 설정값 (필요 시 수정)
# ────────────────────────────────────────────────────────────
APP_DIR="/var/www/app"
APP_PORT=3000
NGINX_DOMAIN="_"          # 도메인 있으면 예: "example.com"

DB_NAME="appdb"
DB_USER="appuser"
DB_PASS="apppass"         # 운영 배포 전 반드시 변경
SESSION_SECRET="$(openssl rand -hex 32)"

NODE_VERSION="22"
PM2_APP_NAME="nestjs-app"

# ────────────────────────────────────────────────────────────
# 1. 시스템 패키지 업데이트
# ────────────────────────────────────────────────────────────
echo "==> [1/9] 시스템 패키지 업데이트"
apt-get update -y
apt-get install -y curl git build-essential nginx mariadb-server openssl

# ────────────────────────────────────────────────────────────
# 2. Node.js 설치 (nvm 경유)
# ────────────────────────────────────────────────────────────
echo "==> [2/9] Node.js ${NODE_VERSION} 설치"
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
fi
echo "Node: $(node -v) / npm: $(npm -v)"

# PM2 전역 설치
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi

# ────────────────────────────────────────────────────────────
# 3. MariaDB 설정
# ────────────────────────────────────────────────────────────
echo "==> [3/9] MariaDB 설정"
systemctl enable mariadb
systemctl start mariadb

# DB / 유저 생성 (이미 있으면 무시)
mariadb -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
echo "MariaDB DB: ${DB_NAME} / USER: ${DB_USER} 준비 완료"

# ────────────────────────────────────────────────────────────
# 4. 앱 디렉토리 준비
# ────────────────────────────────────────────────────────────
echo "==> [4/9] 앱 디렉토리 준비: ${APP_DIR}"
mkdir -p "${APP_DIR}"

# 현재 스크립트 위치 기준으로 프로젝트 복사
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
rsync -a --exclude='node_modules' --exclude='.git' \
  --exclude='server/dist' --exclude='client/dist' \
  "${SCRIPT_DIR}/" "${APP_DIR}/"

# ────────────────────────────────────────────────────────────
# 5. .env.prod 생성
# ────────────────────────────────────────────────────────────
echo "==> [5/9] .env.prod 생성"
cat > "${APP_DIR}/server/.env.prod" <<ENV
NODE_ENV=production
PORT=${APP_PORT}

SESSION_SECRET=${SESSION_SECRET}
SESSION_DB_PATH=${APP_DIR}/server/sessions.sqlite
COOKIE_SECURE=false

DB_HOST=localhost
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}
DB_NAME=${DB_NAME}
ENV

# ────────────────────────────────────────────────────────────
# 6. 클라이언트 빌드
# ────────────────────────────────────────────────────────────
echo "==> [6/9] 클라이언트 빌드 (React + Vite)"
cd "${APP_DIR}/client"
npm ci --prefer-offline
npm run build
echo "클라이언트 빌드 완료: ${APP_DIR}/client/dist"

# ────────────────────────────────────────────────────────────
# 7. 서버 빌드
# ────────────────────────────────────────────────────────────
echo "==> [7/9] 서버 빌드 (NestJS)"
cd "${APP_DIR}/server"
npm ci --prefer-offline --omit=dev
npm run build
echo "서버 빌드 완료: ${APP_DIR}/server/dist"

# ────────────────────────────────────────────────────────────
# 8. PM2 등록 및 실행
# ────────────────────────────────────────────────────────────
echo "==> [8/9] PM2 프로세스 등록"
pm2 delete "${PM2_APP_NAME}" 2>/dev/null || true

pm2 start "${APP_DIR}/server/dist/main.js" \
  --name "${PM2_APP_NAME}" \
  --env production \
  --max-memory-restart 512M \
  --restart-delay 3000 \
  --env-file "${APP_DIR}/server/.env.prod"

pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

echo "PM2 상태:"
pm2 list

# ────────────────────────────────────────────────────────────
# 9. Nginx 설정
# ────────────────────────────────────────────────────────────
echo "==> [9/9] Nginx 설정"
cat > /etc/nginx/sites-available/app <<NGINX
server {
    listen 80;
    server_name ${NGINX_DOMAIN};

    # 업로드 최대 크기 (이미지 base64 포함)
    client_max_body_size 20M;

    # gzip 압축 (2GB RAM 환경 최적화)
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1024;
    gzip_comp_level 4;

    # API → NestJS
    location /api/ {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   Connection        "";
        proxy_read_timeout 60s;
    }

    # SPA → NestJS (정적 파일 서빙 포함)
    location / {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   Connection        "";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable nginx
systemctl restart nginx

# ────────────────────────────────────────────────────────────
# 완료
# ────────────────────────────────────────────────────────────
echo ""
echo "========================================"
echo " 배포 완료!"
echo "========================================"
echo " URL  : http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo " PORT : ${APP_PORT} (Nginx → PM2)"
echo " DB   : MariaDB / ${DB_NAME}"
echo " 앱   : pm2 list"
echo " 로그 : pm2 logs ${PM2_APP_NAME}"
echo "========================================"
echo " [주의] .env.prod 의 DB_PASS, SESSION_SECRET 을 반드시 확인하세요."
echo "========================================"
