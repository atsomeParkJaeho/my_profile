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

  async onApplicationBootstrap() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ott_anime (
        ${this.pk},
        title             VARCHAR(500),
        year              VARCHAR(10),
        quarter           VARCHAR(10),
        image             TEXT,
        netflix_link      TEXT,
        laftel_link       TEXT,
        wavve_link        TEXT,
        watcha_link       TEXT,
        tving_link        TEXT,
        coupangplay_link  TEXT
      )
    `);

    // 최초 1회 나무위키 크롤링 시드 데이터 적재 (이미 데이터가 있으면 건너뜀)
    const [{ count }] = await this.dataSource.query('SELECT COUNT(*) as count FROM ott_anime');
    if (Number(count) === 0 && OTT_SEED_DATA.length > 0) {
      for (const item of OTT_SEED_DATA) {
        await this.query(
          `INSERT INTO ott_anime
            (title, year, quarter, image, netflix_link, laftel_link, wavve_link, watcha_link, tving_link, coupangplay_link)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.title, item.year, item.quarter, item.image,
            item.netflixLink, item.laftelLink, item.wavveLink,
            item.watchaLink, item.tvingLink, item.coupangplayLink,
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
      year: row.year,
      quarter: row.quarter,
      image: row.image,
      netflixLink: row.netflix_link,
      laftelLink: row.laftel_link,
      wavveLink: row.wavve_link,
      watchaLink: row.watcha_link,
      tvingLink: row.tving_link,
      coupangplayLink: row.coupangplay_link,
    };
  }

  async findAll(q?: string, quarter?: string): Promise<any[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (q) {
      conditions.push('title LIKE ?');
      params.push(`%${q}%`);
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
    return this.query(
      `INSERT INTO ott_anime
        (title, year, quarter, image, netflix_link, laftel_link, wavve_link, watcha_link, tving_link, coupangplay_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.title, dto.year ?? '', dto.quarter ?? '', dto.image ?? '',
        dto.netflixLink ?? '', dto.laftelLink ?? '', dto.wavveLink ?? '',
        dto.watchaLink ?? '', dto.tvingLink ?? '', dto.coupangplayLink ?? '',
      ],
    );
  }

  async update(id: number, dto: any): Promise<any> {
    return this.query(
      `UPDATE ott_anime
       SET title = ?, year = ?, quarter = ?, image = ?,
           netflix_link = ?, laftel_link = ?, wavve_link = ?,
           watcha_link = ?, tving_link = ?, coupangplay_link = ?
       WHERE id = ?`,
      [
        dto.title, dto.year ?? '', dto.quarter ?? '', dto.image ?? '',
        dto.netflixLink ?? '', dto.laftelLink ?? '', dto.wavveLink ?? '',
        dto.watchaLink ?? '', dto.tvingLink ?? '', dto.coupangplayLink ?? '',
        id,
      ],
    );
  }

  async remove(id: number): Promise<any> {
    return this.query('DELETE FROM ott_anime WHERE id = ?', [id]);
  }
}
