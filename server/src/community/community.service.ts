import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CommunityService implements OnApplicationBootstrap {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private get isMariaDB(): boolean {
    return this.dataSource.options.type === 'mariadb' ||
           this.dataSource.options.type === 'mysql';
  }

  async onApplicationBootstrap() {
    const pk = this.isMariaDB
      ? 'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY'
      : 'id INTEGER PRIMARY KEY AUTOINCREMENT';

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS community_table (
        ${pk},
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

    // 기존 테이블에 content 컬럼이 없는 경우 추가
    try {
      const colType = this.isMariaDB ? 'TEXT' : 'TEXT';
      await this.dataSource.query(
        `ALTER TABLE community_table ADD COLUMN content ${colType}`,
      );
    } catch { /* 이미 존재하면 무시 */ }
  }

  private getNow() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 8);
    return { date, time };
  }

  async findOne(id: number): Promise<any> {
    const rows = await this.dataSource.query(
      'SELECT * FROM community_table WHERE id = ?',
      [id],
    );
    return rows[0] ?? null;
  }

  async findAll(): Promise<any[]> {
    return this.dataSource.query(
      'SELECT * FROM community_table ORDER BY id DESC',
    );
  }

  async create(dto: any): Promise<any> {
    const { date, time } = this.getNow();
    return this.dataSource.query(
      `INSERT INTO community_table (title, content, c_date, c_time, c_user_name)
       VALUES (?, ?, ?, ?, ?)`,
      [dto.title, dto.content ?? '', date, time, dto.c_user_name],
    );
  }

  async remove(id: number): Promise<any> {
    return this.dataSource.query(
      'DELETE FROM community_table WHERE id = ?',
      [id],
    );
  }

  async update(id: number, dto: any): Promise<any> {
    const { date, time } = this.getNow();
    return this.dataSource.query(
      `UPDATE community_table
       SET title = ?, content = ?, e_date = ?, e_time = ?, e_user_name = ?
       WHERE id = ?`,
      [dto.title, dto.content ?? '', date, time, dto.e_user_name, id],
    );
  }
}
