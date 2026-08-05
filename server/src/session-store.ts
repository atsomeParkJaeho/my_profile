import Database from 'better-sqlite3';

/**
 * better-sqlite3 기반 세션 스토어
 * - 서버 재시작 후에도 세션 유지
 * - @fastify/session의 connect 호환 스토어 인터페이스 구현
 */
export class SqliteSessionStore {
  private db: ReturnType<typeof Database>;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid     TEXT    PRIMARY KEY,
        sess    TEXT    NOT NULL,
        expired INTEGER NOT NULL
      );
    `);

    // 만료 세션 주기적 정리 (1시간마다)
    setInterval(() => this.clearExpired(), 60 * 60 * 1000);
  }

  get(sid: string, callback: (err: any, session?: any) => void): void {
    try {
      const row = this.db
        .prepare('SELECT sess FROM sessions WHERE sid = ? AND expired > ?')
        .get(sid, Date.now()) as { sess: string } | undefined;

      callback(null, row ? JSON.parse(row.sess) : null);
    } catch (e) {
      callback(e);
    }
  }

  set(sid: string, session: any, callback: (err?: any) => void): void {
    try {
      const maxAge = session?.cookie?.maxAge ?? 7 * 24 * 60 * 60 * 1000;
      const expired = Date.now() + maxAge;

      this.db
        .prepare('INSERT OR REPLACE INTO sessions (sid, sess, expired) VALUES (?, ?, ?)')
        .run(sid, JSON.stringify(session), expired);

      callback();
    } catch (e) {
      callback(e);
    }
  }

  destroy(sid: string, callback: (err?: any) => void): void {
    try {
      this.db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      callback();
    } catch (e) {
      callback(e);
    }
  }

  clearAll(): void {
    this.db.prepare('DELETE FROM sessions').run();
  }

  private clearExpired(): void {
    this.db.prepare('DELETE FROM sessions WHERE expired <= ?').run(Date.now());
  }
}
