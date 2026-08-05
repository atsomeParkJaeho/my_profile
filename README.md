# React + NestJS(Fastify) + SQLite — 동일 포트 로컬 예제

React와 NestJS(Fastify)를 **같은 포트(기본 3000)** 에서 실행하는 예제입니다.
- 개발 모드: Vite를 NestJS(Fastify)의 미들웨어로 붙여서 React 코드 수정이 실시간(HMR)으로 반영됩니다.
- 프로덕션 모드: React를 빌드한 정적 파일을 NestJS(Fastify)가 그대로 서빙합니다.

DB는 SQLite(TypeORM + better-sqlite3)를 사용하며, 서버 실행 시 `server/db.sqlite` 파일이 자동 생성됩니다.

## 폴더 구조

```
nestjs-react-sqlite/
├── client/     ← React (Vite)
│   └── src/
│       ├── main.tsx
│       └── App.tsx
└── server/     ← NestJS (Fastify 어댑터)
    └── src/
        ├── main.ts          ← 동일 포트 구성 핵심 로직
        ├── app.module.ts    ← SQLite 연결
        └── users/           ← 예제 CRUD 모듈
```

## 1. 설치

두 프로젝트 모두 의존성을 각각 설치해야 합니다.

```bash
cd server
npm install

cd ../client
npm install
```

> 이 프로젝트는 코드/설정 파일만 생성된 상태이며, `npm install`은 실제 인터넷 환경에서 직접 실행해야 합니다.

## 2. 개발 모드 실행 (HMR 유지, 같은 포트)

**server 폴더에서 실행**합니다. (client는 별도로 실행하지 않습니다 — server가 내부적으로 Vite를 구동합니다)

```bash
cd server
npm run start:dev
```

- 접속: http://localhost:3000
- React 코드(`client/src/*`)를 수정하면 바로 반영됩니다.
- API는 `/api/users` 로 호출됩니다 (`app.setGlobalPrefix('api')`).

## 3. 프로덕션 모드 실행 (빌드 후 정적 서빙, 같은 포트)

```bash
# 1) React 빌드
cd client
npm run build        # client/dist 생성

# 2) NestJS 빌드 + 실행
cd ../server
npm run build         # server/dist 생성
npm run start:prod     # http://localhost:3000
```

## 4. 동작 확인

브라우저에서 http://localhost:3000 접속 → 이름/이메일 입력 후 "추가" 클릭 → 목록에 사용자가 추가되고, 새로고침해도 SQLite에 저장된 데이터가 유지됩니다.

API를 직접 테스트하려면:

```bash
curl http://localhost:3000/api/users

curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"홍길동","email":"hong@test.com"}'
```

## 5. 포트 변경

```bash
PORT=4000 npm run start:dev
```

## 동일 포트가 되는 원리 (main.ts)

- **개발 모드**: `@fastify/middie`로 Fastify에 Connect 스타일 미들웨어 지원을 추가한 뒤, Vite를 `middlewareMode: true`로 생성해서 `fastifyInstance.use(vite.middlewares)`로 연결합니다. `/api/*` 는 NestJS 컨트롤러가, 그 외 요청은 Vite(React)가 같은 포트에서 함께 처리합니다.
- **프로덕션 모드**: `@fastify/static`으로 `client/dist`를 정적 서빙하고, 404 핸들러에서 `/api`가 아닌 요청은 `index.html`을 반환해 SPA 라우팅을 지원합니다.
