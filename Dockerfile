# ─── Stage 1: React 클라이언트 빌드 ───────────────────────────────────────────
FROM node:24-alpine AS client-build

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build


# ─── Stage 2: NestJS 서버 빌드 ────────────────────────────────────────────────
FROM node:24-alpine AS server-build

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/ ./
RUN npm run build


# ─── Stage 3: 프로덕션 이미지 (NestJS API 서버) ───────────────────────────────
FROM node:24-alpine AS production

WORKDIR /app/server

# 프로덕션 의존성만 설치
COPY server/package*.json ./
RUN npm ci --omit=dev

# 서버 빌드 결과물 복사
COPY --from=server-build /app/server/dist ./dist

# React 빌드 결과물 복사 (볼륨 마운트로 Nginx와 공유)
COPY --from=client-build /app/client/dist ../client/dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/main"]


# ─── Stage 4: Nginx 클라이언트 서버 (포트 8080) ───────────────────────────────
FROM nginx:alpine AS client-server

# React 빌드 결과물 복사
COPY --from=client-build /app/client/dist /usr/share/nginx/html

EXPOSE 8080
