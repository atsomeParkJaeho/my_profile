import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ProfileService implements OnApplicationBootstrap {
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
    const vc = (n: number) => this.isMariaDB ? `VARCHAR(${n})` : 'TEXT';

    // ── myself_info 테이블 생성 ──
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS myself_info (
        ${pk},
        name          ${vc(100)},
        email         ${vc(200)},
        intro         TEXT,
        phone         ${vc(50)},
        location      ${vc(200)},
        website       ${vc(300)},
        org           ${vc(200)},
        tech          ${vc(500)},
        sns_instar    ${vc(300)},
        sns_naver_blog ${vc(300)},
        langue        ${vc(200)},
        school        ${vc(300)},
        birthday      ${vc(20)},
        c_datetime    ${vc(30)},
        e_datetime    ${vc(30)}
      )
    `);

    // 기존 테이블에 누락된 컬럼 추가 (이미 있으면 무시)
    const infoColDefs = this.isMariaDB
      ? [
          'intro TEXT', 'phone VARCHAR(50)', 'location VARCHAR(200)',
          'website VARCHAR(300)', 'org VARCHAR(200)', 'tech VARCHAR(500)',
          'sns_instar VARCHAR(300)', 'sns_naver_blog VARCHAR(300)',
          'name VARCHAR(100)', 'email VARCHAR(200)',
          'langue VARCHAR(200)', 'school VARCHAR(300)', 'birthday VARCHAR(20)',
          'c_datetime VARCHAR(30)', 'e_datetime VARCHAR(30)',
        ]
      : [
          'intro TEXT', 'phone TEXT', 'location TEXT', 'website TEXT',
          'org TEXT', 'tech TEXT', 'sns_instar TEXT', 'sns_naver_blog TEXT',
          'name TEXT', 'email TEXT',
          'langue TEXT', 'school TEXT', 'birthday TEXT',
          'c_datetime TEXT', 'e_datetime TEXT',
        ];

    for (const col of infoColDefs) {
      try {
        await this.dataSource.query(`ALTER TABLE myself_info ADD COLUMN ${col}`);
      } catch { /* 이미 존재하면 무시 */ }
    }

    // 불필요한 컬럼 제거 (이미 없으면 무시)
    const dropCols = ['address', 'link', 'group_name', 'stack', 'phone_number'];
    for (const col of dropCols) {
      try {
        await this.dataSource.query(`ALTER TABLE myself_info DROP COLUMN ${col}`);
      } catch { /* 컬럼이 없으면 무시 */ }
    }

    // row가 없으면 1건 삽입, 2건 이상이면 가장 오래된 row만 유지
    const rows = await this.dataSource.query('SELECT id FROM myself_info ORDER BY id ASC');
    if (rows.length === 0) {
      await this.dataSource.query(`INSERT INTO myself_info (intro) VALUES ('')`);
    } else if (rows.length > 1) {
      const keepId = rows[0].id;
      await this.dataSource.query(`DELETE FROM myself_info WHERE id != ?`, [keepId]);
    }

    // ── career_list 테이블 생성 ──
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS career_list (
        ${pk},
        company   ${vc(200)},
        role      ${vc(200)},
        start_dt  ${vc(20)},
        end_dt    ${vc(20)},
        \`desc\`  TEXT,
        order_no  INT DEFAULT 0
      )
    `);

    // 기존 테이블에 누락된 컬럼 추가 (이미 있으면 무시)
    const careerColDefs = this.isMariaDB
      ? ['company VARCHAR(200)', 'role VARCHAR(200)', 'start_dt VARCHAR(20)',
         'end_dt VARCHAR(20)', '`desc` TEXT', 'order_no INT DEFAULT 0']
      : ['company TEXT', 'role TEXT', 'start_dt TEXT',
         'end_dt TEXT', 'desc TEXT', 'order_no INTEGER DEFAULT 0'];

    for (const col of careerColDefs) {
      try {
        await this.dataSource.query(`ALTER TABLE career_list ADD COLUMN ${col}`);
      } catch { /* 이미 존재하면 무시 */ }
    }
  }

  // ── myself_info ──
  async getInfo(): Promise<any> {
    const rows = await this.dataSource.query('SELECT * FROM myself_info LIMIT 1');
    return rows[0] ?? null;
  }

  private getNow(): string {
    const now = new Date();
    return now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 8);
  }

  async updateInfo(dto: any): Promise<any> {
    const rows = await this.dataSource.query('SELECT c_datetime FROM myself_info LIMIT 1');
    const c_datetime = rows[0]?.c_datetime || this.getNow();
    return this.dataSource.query(
      `UPDATE myself_info SET
        name=?, email=?, intro=?, phone=?, location=?, website=?, org=?, tech=?,
        sns_instar=?, sns_naver_blog=?,
        langue=?, school=?, birthday=?,
        c_datetime=?, e_datetime=?
       WHERE id=1`,
      [dto.name, dto.email, dto.intro, dto.phone, dto.location, dto.website,
       dto.org, dto.tech, dto.sns_instar, dto.sns_naver_blog,
       dto.langue, dto.school, dto.birthday,
       c_datetime, this.getNow()],
    );
  }

  // ── career_list ──
  async getCareers(): Promise<any[]> {
    return this.dataSource.query('SELECT * FROM career_list ORDER BY order_no ASC');
  }

  async createCareer(dto: any): Promise<any> {
    return this.dataSource.query(
      `INSERT INTO career_list (company, role, start_dt, end_dt, \`desc\`, order_no)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [dto.company, dto.role, dto.start_dt, dto.end_dt, dto.desc, dto.order_no ?? 0],
    );
  }

  async updateCareer(id: number, dto: any): Promise<any> {
    return this.dataSource.query(
      `UPDATE career_list SET company=?, role=?, start_dt=?, end_dt=?, \`desc\`=?, order_no=?
       WHERE id=?`,
      [dto.company, dto.role, dto.start_dt, dto.end_dt, dto.desc, dto.order_no ?? 0, id],
    );
  }

  async deleteCareer(id: number): Promise<any> {
    return this.dataSource.query('DELETE FROM career_list WHERE id=?', [id]);
  }
}
