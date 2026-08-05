# 프로젝트 환경 설정 문서

## 기술 스택

| 구분 | 기술 | 버전 |
|---|---|---|
| 런타임 | Node.js | 24.x |
| 백엔드 | NestJS + Fastify | 10.x |
| 프론트엔드 | React + Vite | 18.x / 5.x |
| 라우팅 | react-router-dom | 7.x |
| HTTP 클라이언트 | axios | 1.x |
| ORM | TypeORM | 0.3.x |
| DB 드라이버 | mysql2 / better-sqlite3 | 3.x / 12.x |
| DB | MariaDB (Docker) 또는 SQLite (기본/exe) | 11 / - |
| 인증 | 서버 세션 (@fastify/session + @fastify/cookie) | - |
| 비밀번호 해싱 | bcrypt | 6.x |
| 컨테이너 | Docker + Docker Compose | - |
| 패키징 | @yao-pkg/pkg (Windows exe) | 6.x |

---

## 프로젝트 구조

```
nestjs-react-sqlite_1/
├── Dockerfile              멀티스테이지 프로덕션 빌드
├── docker-compose.yml      app + MariaDB 컨테이너 구성
├── .dockerignore
├── build-exe.ps1           Windows exe 빌드 스크립트
├── setup.sh                Ubuntu 환경 초기 설치 스크립트
├── release/                exe 빌드 결과물 (server.exe)
├── SETUP.md                현재 문서
├── client/                 React 프론트엔드
│   ├── src/
│   │   ├── api.ts          axios 인스턴스 (withCredentials: true)
│   │   ├── auth.ts         GET /api/auth/me 세션 확인 유틸
│   │   ├── styles.ts       공통 인라인 스타일
│   │   ├── App.tsx         라우터 + 세션 초기화
│   │   └── pages/
│   │       ├── LoginPage.tsx   /login
│   │       ├── SigninPage.tsx  /signin
│   │       └── HomePage.tsx   /home
│   └── package.json
└── server/
    ├── src/
    │   ├── main.ts                         서버 진입점, Fastify + 세션 설정
    │   ├── app.module.ts                   TypeORM 연결, 모듈 등록
    │   ├── auth/
    │   │   ├── dto/
    │   │   │   ├── signup.dto.ts           이름·이메일·비밀번호 검증
    │   │   │   └── login.dto.ts            이메일·비밀번호 검증
    │   │   ├── guards/
    │   │   │   └── session-auth.guard.ts   세션 인증 가드
    │   │   ├── auth.controller.ts          인증 엔드포인트 5개
    │   │   ├── auth.service.ts             회원가입·로그인·로그아웃·탈퇴
    │   │   └── auth.module.ts
    │   └── users/
    │       ├── entities/user.entity.ts     DB 테이블 스키마
    │       ├── dto/create-user.dto.ts      입력값 검증
    │       ├── users.controller.ts         유저 CRUD 엔드포인트
    │       ├── users.service.ts            DB 조작
    │       └── users.module.ts
    ├── .env.dev            개발 환경변수 (SQLite)
    ├── .env.prod           운영 환경변수 (MariaDB)
    ├── .env.example        환경변수 템플릿 (git 추적)
    └── package.json
```

---

## API 엔드포인트

글로벌 prefix: `/api`

### 인증 (`/api/auth`)

| 메서드 | URL | 인증 필요 | 설명 |
|---|---|---|---|
| POST | `/api/auth/signup` | 없음 | 회원가입 |
| POST | `/api/auth/login` | 없음 | 로그인 → 세션 생성 |
| POST | `/api/auth/logout` | 세션 | 로그아웃 → 세션 파기 |
| GET | `/api/auth/me` | 세션 | 현재 로그인 유저 확인 |
| DELETE | `/api/auth/me` | 세션 | 회원탈퇴 → 세션 파기 |

### 유저 (`/api/users`)

| 메서드 | URL | 설명 |
|---|---|---|
| GET | `/api/users` | 전체 유저 조회 (id DESC) |
| POST | `/api/users` | 유저 생성 |
| DELETE | `/api/users/:id` | 유저 삭제 |

### 요청/응답 예시

```json
// POST /api/auth/signup
{ "name": "홍길동", "email": "hong@test.com", "password": "123456" }
→ { "id": 1, "name": "홍길동", "email": "hong@test.com" }

// POST /api/auth/login
{ "email": "hong@test.com", "password": "123456" }
→ { "name": "홍길동", "email": "hong@test.com" }
  + Set-Cookie: sessionId=xxx (HttpOnly)

// GET /api/auth/me
→ { "id": 1, "name": "홍길동", "email": "hong@test.com" }
```

---

## 인증 방식 — 서버 세션

```
로그인
  → 서버: 세션 생성 (메모리 저장)
  → 브라우저: HttpOnly 쿠키로 session ID만 수신
  → JS에서 쿠키 접근 불가 (XSS 방어)

요청
  → 브라우저가 쿠키 자동 전송 (axios withCredentials: true)
  → 서버: 세션 ID로 유저 정보 조회

새로고침
  → App.tsx: GET /api/auth/me 호출
  → 세션 유효 → 로그인 상태 유지
  → 세션 만료 → /login 이동

로그아웃 / 탈퇴
  → 서버: session.destroy() → 즉시 무효화
```

---

## DB 선택 로직

```
DB_HOST 환경변수 없음  →  SQLite  (db.sqlite 파일, 기본값 / exe)
DB_HOST 환경변수 있음  →  MariaDB (Docker 실행 시)
```

---

## DB 테이블 스키마 (user)

```sql
CREATE TABLE `user` (
  `id`        INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name`      VARCHAR(255) NOT NULL,
  `email`     VARCHAR(255) NOT NULL UNIQUE,
  `password`  VARCHAR(255) NOT NULL,   -- bcrypt 해시, SELECT 기본 제외
  `createdAt` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);
```

> `password` 컬럼은 `select: false` — 일반 조회에서 자동 제외되며,
> `findByEmail()` 내 `createQueryBuilder().addSelect('user.password')` 로만 포함됩니다.

---

## 환경변수

| 변수 | 기본값 | 설명 |
|---|---|---|
| `NODE_ENV` | `development` | 실행 환경 |
| `PORT` | `3000` | 서버 포트 |
| `SESSION_SECRET` | *(필수)* | 세션 서명 비밀키 (32자 이상 권장) |
| `DB_PATH` | `db.sqlite` | SQLite 파일 경로 |
| `DB_HOST` | *(없음)* | MariaDB 호스트 — **설정 시 MariaDB 사용** |
| `DB_PORT` | `3306` | MariaDB 포트 |
| `DB_USER` | `root` | MariaDB 사용자 |
| `DB_PASS` | `` | MariaDB 비밀번호 |
| `DB_NAME` | `appdb` | MariaDB DB 이름 |

---

## 클라이언트 라우팅

| 경로 | 로그인 상태 | 비로그인 상태 |
|---|---|---|
| `/` | `/home` 리다이렉트 | `/login` 리다이렉트 |
| `/login` | `/home` 리다이렉트 | 로그인 화면 |
| `/signin` | `/home` 리다이렉트 | 회원가입 화면 |
| `/home` | 홈 화면 | `/login` 리다이렉트 |

> 앱 최초 마운트 시 `GET /api/auth/me` 로 세션 확인 후 라우팅 결정

---

## 서버 서빙 방식

| 환경 | 방식 |
|---|---|
| 개발 (`NODE_ENV != production`) | Vite 미들웨어 모드 (HMR, `transformIndexHtml`) |
| 프로덕션 / exe | `@fastify/static` 으로 `client/dist` 정적 서빙 |

SPA 라우팅 fallback: `app.init()` 이후 Fastify 와일드카드 `GET /*` 등록
→ `/api/*` 는 NestJS 라우트가 선처리, 나머지는 `index.html` 반환

---

## Docker 구성

```
┌─────────────────────────┐       ┌──────────────────────────┐
│  app (NestJS)  :3000    │──DB──▶│  db (MariaDB 11)  :3306  │
│  멀티스테이지 빌드       │       │  볼륨: mariadb-data       │
└─────────────────────────┘       └──────────────────────────┘
```

### Dockerfile 멀티스테이지 빌드

```
Stage 1 (client-build)  →  npm ci + vite build       → client/dist/
Stage 2 (server-build)  →  npm ci + nest build        → server/dist/
Stage 3 (production)    →  프로덕션 의존성 + 결과물만  → 최종 이미지
```

---

## 실행 방법

### Docker (MariaDB)

```bash
# 빌드 + 실행
docker compose up --build -d

# 로그 확인
docker compose logs -f app

# MariaDB 접속
docker compose exec db mariadb -u appuser -papppass appdb

# 종료 (데이터 유지)
docker compose down

# 종료 + 데이터 삭제
docker compose down -v
```

### 로컬 개발 (SQLite)

```bash
# 환경변수 설정
cp server/.env.dev server/.env

# 터미널 1 — 백엔드 (포트 3000)
cd server && npm install && npm run start:dev

# 터미널 2 — 프론트엔드 (포트 5173)
cd client && npm install && npm run dev
```

### Windows exe (SQLite, 도커 불필요)

```powershell
# 빌드 (client + server + pkg 패키징)
.\build-exe.ps1

# 실행
.\release\server.exe

# 포트 변경
$env:PORT=8080; .\release\server.exe
```

접속: `http://localhost:3000`

### Ubuntu 초기 설치

```bash
chmod +x setup.sh && sudo ./setup.sh
# 대화형으로 Docker / 개발모드 / 설치만 선택
```

---

## 변경 이력

| 날짜 | 내용 |
|---|---|
| 2026-07-29 | 초기 구성: NestJS + React + SQLite |
| 2026-07-29 | better-sqlite3 v12 업그레이드 (Node.js 24 호환) |
| 2026-07-29 | SQLite → MariaDB 전환, Docker Compose 구성 추가 |
| 2026-07-29 | fetch → axios 전환, pkg exe 빌드 환경 추가 |
| 2026-07-29 | DB 자동 선택 로직 (DB_HOST 유무 기준) |
| 2026-07-29 | 회원가입·로그인·회원탈퇴 기능 추가 (bcrypt 해싱) |
| 2026-07-29 | JWT + localStorage → 서버 세션 + HttpOnly 쿠키로 전환 |
| 2026-07-29 | SPA 라우팅 추가 (/login, /signin, /home), 새로고침 세션 유지 |
| 2026-07-29 | Ubuntu 설치 스크립트 (setup.sh), .env 파일 분리 (.env.dev / .env.prod) |
