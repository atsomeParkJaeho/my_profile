# 프로젝트 구조

이 저장소는 4개의 독립된 폴더로 구성되어 있습니다.

## 1. `/viewer` — 데스크톱 뷰어 실행기 (Electron)

`server`(NestJS)와 `client`(React) 빌드 결과물을 감싸서 하나의 데스크톱 실행 파일로 배포하기 위한 Electron 앱입니다.

- **역할**: `server/dist` + `client/dist`를 내장해 로컬에서 서버를 구동하고, Electron 창으로 앱 화면을 띄우는 실행기
- **주요 파일**
  - `main.js` — Electron 메인 프로세스, 서버 구동 및 창 생성
  - `launch.vbs` — 콘솔 창 없이 조용히 실행하기 위한 Windows 런처 스크립트
  - `package.json` — `electron-builder`로 패키징 시 `../server/dist`, `../server/node_modules`, `../client/dist`를 `extraResources`로 포함
- **실행**: `npm start` (Electron 개발 실행) / `npm run pack` (electron-builder로 배포용 빌드)
- **의존 관계**: `server`, `client`가 먼저 빌드되어 있어야 정상 동작

## 2. `/renshu_app` — React Native 모바일 앱

React Native CLI(Expo 아님) 기반의 모바일 앱 프로젝트입니다.

- **스택**: React Native 0.87.1, React 19.2.3, TypeScript
- **플랫폼**: `android/`, `ios/` 네이티브 프로젝트 포함
- **실행**
  - `npm run android` — Android 에뮬레이터/기기 실행 (Metro 포트 8082 고정)
  - `npm run ios` — iOS 시뮬레이터 실행 (macOS 전용)
  - `npm start` — Metro 번들러 단독 실행
- **의존 관계**: `client`, `server`와 별도로 동작하는 독립 프로젝트 (API 연동 시 `server`를 백엔드로 사용 예정)

## 3. `/server` — NestJS 백엔드

Fastify 어댑터 기반 NestJS 서버입니다.

- **스택**: NestJS + Fastify, TypeORM (better-sqlite3 / PostgreSQL 자동 분기), Puppeteer(가격 크롤링)
- **모듈**: `users`, `auth`, `community`, `profile`, `comment`, `contact`, `pricefind`
- **DB**: `DB_HOST` 환경변수 유무로 로컬(SQLite) / 배포(PostgreSQL) 자동 선택
- **역할**
  - 개발 모드: Vite를 Fastify 미들웨어로 붙여 `client`와 같은 포트에서 HMR 지원
  - 프로덕션 모드: `client/dist`를 정적 서빙 + API(`/api/*`) 제공
- **실행**: `npm run start:dev` (개발) / `npm run start:prod` (빌드 후 운영) / `npm run build:exe` (Windows exe 패키징)

## 4. `/client` — React 프론트엔드 (Vite)

`server`와 같은 포트에서 서빙되는 웹 프론트엔드입니다.

- **스택**: Vite + React 18, Redux Toolkit, React Router v7, Tailwind CSS, Bootstrap
- **페이지**: 프로필(`/home`), 게시판/포트폴리오(`/community`, `/banner`, `/gallery`), 가격 비교(`/pricefind`), 문의하기(`/contact`), 로그인(`/login`)
- **실행**
  - 단독 개발: `npm run dev`
  - 통합 개발: `server`에서 `npm run start:dev` 실행 시 자동으로 미들웨어로 연결됨
  - 빌드: `npm run build` → `dist/`를 `server`가 정적 서빙 (또는 `viewer`가 패키징)

---

## 전체 관계도

```
renshu_app (React Native, 독립)
                              server (NestJS) ── client (React, Vite)
                                    ↑
                              viewer (Electron) : server + client 빌드물을 묶어 데스크톱 앱으로 실행
```
