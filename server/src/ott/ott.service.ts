import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OTT_SEED_DATA } from './ott-seed-data';

@Injectable()
export class OttService implements OnApplicationBootstrap {
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
        `ALTER TABLE ott_anime ADD COLUMN IF NOT EXISTS ${col} ${type}`,
      );
    } else {
      try {
        await this.dataSource.query(`ALTER TABLE ott_anime ADD COLUMN ${col} ${type}`);
      } catch { /* 이미 존재하면 무시 */ }
    }
  }

  // 작성일/수정일에 시각까지 함께 기록
  private getNow() {
    const pad = (n: number) => String(n).padStart(2, '0');
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  // 컬럼 순서: id, title, year, quarter, image, netflix_link, laftel_link, wavve_link,
  // watcha_link, tving_link, disneyplus_link, coupangplay_link, created_at, updated_at, created_by, updated_by
  private readonly COLUMN_ORDER = [
    'title', 'sub_title', 'year', 'quarter', 'image',
    'netflix_link', 'laftel_link', 'wavve_link', 'watcha_link', 'tving_link',
    'disneyplus_link', 'coupangplay_link',
    'created_at', 'updated_at', 'created_by', 'updated_by',
  ];

  private get columnDefs(): [string, string][] {
    return [
      ['title', 'VARCHAR(500)'],
      ['sub_title', 'VARCHAR(500)'],
      ['year', 'VARCHAR(10)'],
      ['quarter', 'VARCHAR(10)'],
      ['image', 'TEXT'],
      ['netflix_link', 'TEXT'],
      ['laftel_link', 'TEXT'],
      ['wavve_link', 'TEXT'],
      ['watcha_link', 'TEXT'],
      ['tving_link', 'TEXT'],
      ['disneyplus_link', 'TEXT'],
      ['coupangplay_link', 'TEXT'],
      ['created_at', 'VARCHAR(20)'],
      ['updated_at', 'VARCHAR(20)'],
      ['created_by', 'VARCHAR(100)'],
      ['updated_by', 'VARCHAR(100)'],
    ];
  }

  private async getColumnNames(): Promise<string[]> {
    if (this.isPostgres) {
      const rows = await this.dataSource.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'ott_anime' ORDER BY ordinal_position`,
      );
      return rows.map((r: any) => r.column_name);
    }
    const rows = await this.dataSource.query('PRAGMA table_info(ott_anime)');
    return rows.map((r: any) => r.name);
  }

  // disneyplus_link를 tving_link 다음으로 옮기는 등, 컬럼 물리적 순서가 기대와 다르면 테이블을 재생성해 맞춘다
  private async reorderColumnsIfNeeded() {
    const existing = await this.getColumnNames();
    const existingDataCols = existing.filter((c) => c !== 'id');
    const expected = this.COLUMN_ORDER.filter((c) => existingDataCols.includes(c));
    const sameOrder = existingDataCols.join(',') === expected.join(',');
    if (sameOrder) return;

    const colList = expected.join(', ');
    const colDefsSql = this.columnDefs
      .filter(([name]) => expected.includes(name))
      .map(([name, type]) => `${name} ${type}`)
      .join(', ');

    await this.dataSource.query(`
      CREATE TABLE ott_anime_reordered (
        ${this.pk},
        ${colDefsSql}
      )
    `);
    await this.dataSource.query(
      `INSERT INTO ott_anime_reordered (${colList}) SELECT ${colList} FROM ott_anime`,
    );
    await this.dataSource.query('DROP TABLE ott_anime');
    await this.dataSource.query('ALTER TABLE ott_anime_reordered RENAME TO ott_anime');
  }

  async onApplicationBootstrap() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ott_anime (
        ${this.pk},
        ${this.columnDefs.map(([name, type]) => `${name} ${type}`).join(',\n        ')}
      )
    `);

    // 기존에 생성된 테이블에 컬럼이 없으면 추가
    for (const [col, type] of this.columnDefs) {
      await this.addColumnIfMissing(col, type);
    }

    await this.reorderColumnsIfNeeded();

    // 최초 1회 나무위키 크롤링 시드 데이터 적재 (이미 데이터가 있으면 건너뜀)
    const [{ count }] = await this.dataSource.query('SELECT COUNT(*) as count FROM ott_anime');
    if (Number(count) === 0 && OTT_SEED_DATA.length > 0) {
      for (const item of OTT_SEED_DATA) {
        await this.query(
          `INSERT INTO ott_anime
            (title, sub_title, year, quarter, image, netflix_link, laftel_link, wavve_link, watcha_link, tving_link, disneyplus_link, coupangplay_link,
             created_at, updated_at, created_by, updated_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.title, (item as any).subTitle ?? '', item.year, item.quarter, item.image,
            item.netflixLink, item.laftelLink, item.wavveLink,
            item.watchaLink, item.tvingLink, item.disneyplusLink ?? '', item.coupangplayLink,
            item.createdAt, item.updatedAt, item.createdBy ?? '크롤러', item.updatedBy ?? '크롤러',
          ],
        );
      }
    }
  }

  private mapRow(row: any): any {
    if (!row) return row;
    return {
      id: row.id,
      title: row.title,
      subTitle: row.sub_title,
      year: row.year,
      quarter: row.quarter,
      image: row.image,
      netflixLink: row.netflix_link,
      laftelLink: row.laftel_link,
      wavveLink: row.wavve_link,
      watchaLink: row.watcha_link,
      tvingLink: row.tving_link,
      disneyplusLink: row.disneyplus_link,
      coupangplayLink: row.coupangplay_link,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
    };
  }

  async findAll(q?: string, quarter?: string): Promise<any[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (q) {
      conditions.push('(title LIKE ? OR sub_title LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (quarter) {
      conditions.push('quarter = ?');
      params.push(quarter);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await this.query(`SELECT * FROM ott_anime ${where} ORDER BY id ASC`, params);
    return rows.map((row: any) => this.mapRow(row));
  }

  async findOne(id: number): Promise<any> {
    const rows = await this.query('SELECT * FROM ott_anime WHERE id = ?', [id]);
    return this.mapRow(rows[0]) ?? null;
  }

  async create(dto: any): Promise<any> {
    const now = this.getNow();
    return this.query(
      `INSERT INTO ott_anime
        (title, sub_title, year, quarter, image, netflix_link, laftel_link, wavve_link, watcha_link, tving_link, disneyplus_link, coupangplay_link,
         created_at, updated_at, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.title, dto.subTitle ?? '', dto.year ?? '', dto.quarter ?? '', dto.image ?? '',
        dto.netflixLink ?? '', dto.laftelLink ?? '', dto.wavveLink ?? '',
        dto.watchaLink ?? '', dto.tvingLink ?? '', dto.disneyplusLink ?? '', dto.coupangplayLink ?? '',
        now, now, dto.userName ?? '', dto.userName ?? '',
      ],
    );
  }

  async update(id: number, dto: any): Promise<any> {
    const now = this.getNow();
    return this.query(
      `UPDATE ott_anime
       SET title = ?, sub_title = ?, year = ?, quarter = ?, image = ?,
           netflix_link = ?, laftel_link = ?, wavve_link = ?,
           watcha_link = ?, tving_link = ?, disneyplus_link = ?, coupangplay_link = ?,
           updated_at = ?, updated_by = ?
       WHERE id = ?`,
      [
        dto.title, dto.subTitle ?? '', dto.year ?? '', dto.quarter ?? '', dto.image ?? '',
        dto.netflixLink ?? '', dto.laftelLink ?? '', dto.wavveLink ?? '',
        dto.watchaLink ?? '', dto.tvingLink ?? '', dto.disneyplusLink ?? '', dto.coupangplayLink ?? '',
        now, dto.userName ?? '',
        id,
      ],
    );
  }

  async remove(id: number): Promise<any> {
    return this.query('DELETE FROM ott_anime WHERE id = ?', [id]);
  }
}
