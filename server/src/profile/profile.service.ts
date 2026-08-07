import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ProfileService implements OnApplicationBootstrap {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private get isPostgres(): boolean {
    return this.dataSource.options.type === 'postgres';
  }

  // ? 파라미터를 PostgreSQL 의 $1,$2... 로 자동 변환
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

  private vc(n: number): string {
    return this.isPostgres ? `VARCHAR(${n})` : 'TEXT';
  }

  private async addColumnIfMissing(table: string, col: string, type: string) {
    if (this.isPostgres) {
      await this.dataSource.query(
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${type}`,
      );
    } else {
      try {
        await this.dataSource.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
      } catch { /* 이미 존재하면 무시 */ }
    }
  }

  async onApplicationBootstrap() {
    const vc = (n: number) => this.vc(n);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS myself_info (
        ${this.pk},
        name           ${vc(100)},
        email          ${vc(200)},
        intro          TEXT,
        phone          ${vc(50)},
        location       ${vc(200)},
        website        ${vc(300)},
        org            ${vc(200)},
        tech           ${vc(500)},
        sns_instar     ${vc(300)},
        sns_naver_blog ${vc(300)},
        langue         ${vc(200)},
        school         ${vc(300)},
        birthday       ${vc(20)},
        c_datetime     ${vc(30)},
        e_datetime     ${vc(30)}
      )
    `);

    const infoColumns: [string, string][] = [
      ['intro', 'TEXT'], ['phone', vc(50)], ['location', vc(200)],
      ['website', vc(300)], ['org', vc(200)], ['tech', vc(500)],
      ['sns_instar', vc(300)], ['sns_naver_blog', vc(300)],
      ['name', vc(100)], ['email', vc(200)],
      ['langue', vc(200)], ['school', vc(300)], ['birthday', vc(20)],
      ['c_datetime', vc(30)], ['e_datetime', vc(30)],
      ['profile_image', 'TEXT'],
    ];
    for (const [col, type] of infoColumns) {
      await this.addColumnIfMissing('myself_info', col, type);
    }

    for (const col of ['address', 'link', 'group_name', 'stack', 'phone_number']) {
      try {
        await this.dataSource.query(`ALTER TABLE myself_info DROP COLUMN ${col}`);
      } catch { /* 없으면 무시 */ }
    }

    const rows = await this.dataSource.query('SELECT id FROM myself_info ORDER BY id ASC');
    if (rows.length === 0) {
      await this.dataSource.query(`INSERT INTO myself_info (intro) VALUES ('')`);
    } else if (rows.length > 1) {
      await this.query('DELETE FROM myself_info WHERE id != ?', [rows[0].id]);
    }

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS career_list (
        ${this.pk},
        company  ${vc(200)},
        role     ${vc(200)},
        start_dt ${vc(20)},
        end_dt   ${vc(20)},
        "desc"   TEXT,
        order_no INT DEFAULT 0
      )
    `);

    const careerColumns: [string, string][] = [
      ['company',     vc(200)],
      ['role',        vc(200)],
      ['start_dt',    vc(20)],
      ['end_dt',      vc(20)],
      ['"desc"',      'TEXT'],
      ['order_no',    'INT DEFAULT 0'],
      ['company_img', 'TEXT'],
    ];
    for (const [col, type] of careerColumns) {
      await this.addColumnIfMissing('career_list', col, type);
    }
  }

  async getInfo(_userId?: number): Promise<any> {
    const rows = await this.dataSource.query('SELECT * FROM myself_info LIMIT 1');
    return rows[0] ?? null;
  }

  async updateProfileImage(profileImage: string): Promise<void> {
    await this.query('UPDATE myself_info SET profile_image=? WHERE id=1', [profileImage]);
  }

  private getNow(): string {
    const now = new Date();
    return now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 8);
  }

  async updateInfo(dto: any): Promise<any> {
    const rows = await this.dataSource.query('SELECT c_datetime FROM myself_info LIMIT 1');
    const c_datetime = rows[0]?.c_datetime || this.getNow();
    return this.query(
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

  async getCareers(): Promise<any[]> {
    return this.dataSource.query('SELECT * FROM career_list ORDER BY order_no ASC');
  }

  async createCareer(dto: any): Promise<any> {
    return this.query(
      `INSERT INTO career_list (company, role, start_dt, end_dt, "desc", order_no, company_img)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [dto.company, dto.role, dto.start_dt, dto.end_dt, dto.desc, dto.order_no ?? 0, dto.company_img ?? null],
    );
  }

  async updateCareer(id: number, dto: any): Promise<any> {
    return this.query(
      `UPDATE career_list SET company=?, role=?, start_dt=?, end_dt=?, "desc"=?, order_no=?, company_img=?
       WHERE id=?`,
      [dto.company, dto.role, dto.start_dt, dto.end_dt, dto.desc, dto.order_no ?? 0, dto.company_img ?? null, id],
    );
  }

  async deleteCareer(id: number): Promise<any> {
    return this.query('DELETE FROM career_list WHERE id=?', [id]);
  }
}
