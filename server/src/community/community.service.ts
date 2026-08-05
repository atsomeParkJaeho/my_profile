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
        e_user_name VARCHAR(100)
      )
    `);

    if (this.isPostgres) {
      await this.dataSource.query(
        `ALTER TABLE community_table ADD COLUMN IF NOT EXISTS content TEXT`,
      );
    } else {
      try {
        await this.dataSource.query(`ALTER TABLE community_table ADD COLUMN content TEXT`);
      } catch { /* 이미 존재하면 무시 */ }
    }
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
      `INSERT INTO community_table (title, content, c_date, c_time, c_user_name)
       VALUES (?, ?, ?, ?, ?)`,
      [dto.title, dto.content ?? '', date, time, dto.c_user_name],
    );
  }

  async remove(id: number): Promise<any> {
    return this.query('DELETE FROM community_table WHERE id = ?', [id]);
  }

  async update(id: number, dto: any): Promise<any> {
    const { date, time } = this.getNow();
    return this.query(
      `UPDATE community_table
       SET title = ?, content = ?, e_date = ?, e_time = ?, e_user_name = ?
       WHERE id = ?`,
      [dto.title, dto.content ?? '', date, time, dto.e_user_name, id],
    );
  }
}
