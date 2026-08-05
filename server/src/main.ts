import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import fastifyStatic  from '@fastify/static';
import fastifyMiddie  from '@fastify/middie';
import fastifyCookie  from '@fastify/cookie';
import fastifySession from '@fastify/session';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import { AppModule } from './app.module';
import { SqliteSessionStore } from './session-store';

const isPkg = typeof (process as any).pkg !== 'undefined';

function resolvePath(...segments: string[]): string {
  const base = isPkg
    ? path.dirname(process.execPath)
    : path.join(__dirname, '..', '..');
  return path.join(base, ...segments);
}

if (isPkg) {
  process.env.BETTER_SQLITE3_DEFAULT_NATIVE_BINDING = path.join(
    __dirname, '..', '..', 'node_modules',
    'better-sqlite3', 'build', 'Release', 'better_sqlite3.node',
  );
}

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const fastifyInstance = app.getHttpAdapter().getInstance();

  // ── 쿠키 + 세션 플러그인 등록 ────────────────────────────────────────────
  const sessionDbPath = isPkg
    ? path.join(path.dirname(process.execPath), 'sessions.sqlite')
    : process.env.SESSION_DB_PATH ?? 'sessions.sqlite';

  // HTTPS 환경에서만 secure 쿠키 사용 (HTTP localhost, Docker HTTP에서는 false)
  const secureCookie = process.env.COOKIE_SECURE === 'true';

  const sessionStore = new SqliteSessionStore(sessionDbPath);
  // 서버 시작 시 기존 세션 전체 삭제 → 재시작 후 자동 로그아웃
  sessionStore.clearAll();
  console.log('[Session] 기존 세션 전체 삭제 완료');

  await app.register(fastifyCookie);
  await app.register(fastifySession, {
    secret: process.env.SESSION_SECRET ?? 'default_secret_must_be_32_chars!!',
    store: sessionStore,
    cookie: {
      httpOnly: true,     // JS에서 접근 불가 (XSS 방어)
      secure: secureCookie, // HTTPS 배포 시에만 true로 설정
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
    },
    saveUninitialized: true,  // 모든 세션 저장 (false일 때 미감지 버그 방지)
  });

  let vite: ViteDevServer | null = null;

  if (isProd || isPkg) {
    await app.register(fastifyStatic, {
      root: resolvePath('client', 'dist'),
      wildcard: false,
      decorateReply: true,
    });
  } else {
    // @nestjs/platform-fastify 버전에 따라 middie가 이미 등록된 경우 스킵
    if (typeof (fastifyInstance as any).use !== 'function') {
      await app.register(fastifyMiddie);
    }

    vite = await createViteServer({
      root: resolvePath('client'),
      server: { middlewareMode: true },
      appType: 'custom',
    });

    (fastifyInstance as any).use(vite.middlewares);
  }

  // ── NestJS 라우트 등록 완료 후 SPA fallback ───────────────────────────────
  await app.init();

  if (isProd || isPkg) {
    fastifyInstance.get('/*', async (req: any, reply: any) => {
      const url: string = req.raw.url ?? '/';
      if (url.startsWith('/api')) { reply.callNotFound(); return; }
      return reply.sendFile('index.html');
    });
  } else {
    fastifyInstance.get('/*', async (req: any, reply: any) => {
      const url: string = req.raw.url ?? '/';
      if (url.startsWith('/api')) { reply.callNotFound(); return; }
      try {
        const indexPath = path.join(resolvePath('client'), 'index.html');
        let html = fs.readFileSync(indexPath, 'utf-8');
        html = await vite!.transformIndexHtml(url, html);
        reply.type('text/html').send(html);
      } catch (e) {
        vite!.ssrFixStacktrace(e as Error);
        reply.status(500).send((e as Error).message);
      }
    });
  }

  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: '0.0.0.0' });

  const mode = isPkg ? 'exe' : isProd ? 'production' : 'development';
  console.log(`서버 실행 중: http://localhost:${port} (${mode})`);
}

bootstrap();
