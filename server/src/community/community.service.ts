import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CommunityService implements OnApplicationBootstrap {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private get isPostgres(): boolean {
    return this.dataSource.options.type === 'postgres';
  }

  private query(sql: string, params?: any[]): Promise<any> {
    if (this.isPostgres && params?.length) {
      let i = 0;
      sql = sql.replace(/\?/g, () => `$${++i}`);
    }
    return this.dataSource.query(sql, params);
  }

  private get pk(): string {
    return this.isPostgres
      ? 'id SERIAL PRIMARY KEY'
      : 'id INTEGER PRIMARY KEY AUTOINCREMENT';
  }

  private async addColumnIfMissing(col: string, type: string) {
    if (this.isPostgres) {
      await this.dataSource.query(
        `ALTER TABLE community_table ADD COLUMN IF NOT EXISTS ${col} ${type}`,
      );
    } else {
      try {
        await this.dataSource.query(`ALTER TABLE community_table ADD COLUMN ${col} ${type}`);
      } catch { /* 이미 존재하면 무시 */ }
    }
  }

  async onApplicationBootstrap() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS community_table (
        ${this.pk},
        title       VARCHAR(500),
        content     TEXT,
        c_date      VARCHAR(20),
        c_time      VARCHAR(20),
        c_user_name VARCHAR(100),
        e_date      VARCHAR(20),
        e_time      VARCHAR(20),
        e_user_name VARCHAR(100),
        type        VARCHAR(20) DEFAULT 'default',
        extra1      TEXT,
        extra2      TEXT,
        extra3      TEXT,
        extra4      TEXT
      )
    `);

    // 기존 테이블에 누락된 컬럼 추가
    const columns: [string, string][] = [
      ['content',     'TEXT'],
      ['type',        "VARCHAR(20) DEFAULT 'default'"],
      ['extra1',      'TEXT'],
      ['extra2',      'TEXT'],
      ['extra3',      'TEXT'],
      ['extra4',      'TEXT'],
    ];
    for (const [col, type] of columns) {
      await this.addColumnIfMissing(col, type);
    }

    // 기존 데이터 type 컬럼이 NULL인 경우 'default' 로 초기화
    await this.query(
      `UPDATE community_table SET type = ? WHERE type IS NULL`,
      ['default'],
    );
  }

  private getNow() {
    const now = new Date();
    return { date: now.toISOString().slice(0, 10), time: now.toTimeString().slice(0, 8) };
  }

  async findOne(id: number): Promise<any> {
    const rows = await this.query('SELECT * FROM community_table WHERE id = ?', [id]);
    return rows[0] ?? null;
  }

  async findAll(): Promise<any[]> {
    return this.dataSource.query('SELECT * FROM community_table ORDER BY id DESC');
  }

  async create(dto: any): Promise<any> {
    const { date, time } = this.getNow();
    return this.query(
      `INSERT INTO community_table (title, content, c_date, c_time, c_user_name, type, extra1, extra2, extra3, extra4)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [dto.title, dto.content ?? '', date, time, dto.c_user_name,
       dto.type ?? 'default', dto.extra1 ?? null, dto.extra2 ?? null, dto.extra3 ?? null, dto.extra4 ?? null],
    );
  }

  async remove(id: number): Promise<any> {
    return this.query('DELETE FROM community_table WHERE id = ?', [id]);
  }

  async update(id: number, dto: any): Promise<any> {
    const { date, time } = this.getNow();
    return this.query(
      `UPDATE community_table
       SET title = ?, content = ?, e_date = ?, e_time = ?, e_user_name = ?,
           type = ?, extra1 = ?, extra2 = ?, extra3 = ?, extra4 = ?
       WHERE id = ?`,
      [dto.title, dto.content ?? '', date, time, dto.e_user_name,
       dto.type ?? 'default', dto.extra1 ?? null, dto.extra2 ?? null, dto.extra3 ?? null, dto.extra4 ?? null,
       id],
    );
  }
}
