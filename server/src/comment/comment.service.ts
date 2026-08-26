import { Injectable, OnApplicationBootstrap, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CommentService implements OnApplicationBootstrap {
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
    return this.isPostgres ? 'id SERIAL PRIMARY KEY' : 'id INTEGER PRIMARY KEY AUTOINCREMENT';
  }

  async onApplicationBootstrap() {
    const vc = (n: number) => this.isPostgres ? `VARCHAR(${n})` : 'TEXT';
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS community_comment (
        ${this.pk},
        post_id  INTEGER NOT NULL,
        name     ${vc(100)},
        password ${vc(200)},
        content  TEXT,
        c_date   ${vc(20)},
        c_time   ${vc(20)},
        e_date   ${vc(20)},
        e_time   ${vc(20)}
      )
    `);
  }

  private getNow() {
    const now = new Date();
    return { date: now.toISOString().slice(0, 10), time: now.toTimeString().slice(0, 8) };
  }

  async findByPostId(postId: number): Promise<any[]> {
    const rows = await this.query(
      `SELECT id, post_id, name, content, c_date, c_time, e_date, e_time
       FROM community_comment WHERE post_id = ? ORDER BY id ASC`,
      [postId],
    );
    return rows;
  }

  async create(dto: { postId: number; name: string; password: string; content: string }): Promise<void> {
    const { date, time } = this.getNow();
    const hashed = await bcrypt.hash(dto.password, 10);
    await this.query(
      `INSERT INTO community_comment (post_id, name, password, content, c_date, c_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [dto.postId, dto.name, hashed, dto.content, date, time],
    );
  }

  async remove(id: number, password: string): Promise<void> {
    const rows = await this.query(
      'SELECT password FROM community_comment WHERE id = ?', [id],
    );
    if (!rows.length) throw new NotFoundException('?ìÍ???Ï∞æÏùÑ ???ÜÏäµ?àÎã§.');
    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) throw new ForbiddenException('ÎπÑÎ?Î≤àÌò∏Í∞Ä ?ºÏπò?òÏ? ?äÏäµ?àÎã§.');
    await this.query('DELETE FROM community_comment WHERE id = ?', [id]);
  }
}
