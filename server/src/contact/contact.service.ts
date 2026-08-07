import { Injectable, OnApplicationBootstrap, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Resend } from 'resend';

const TO_EMAIL = 'woghsla85@naver.com';

@Injectable()
export class ContactService implements OnApplicationBootstrap {
  private resend: Resend | null = null;

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
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) this.resend = new Resend(apiKey);

    const vc = (n: number) => this.isPostgres ? `VARCHAR(${n})` : 'TEXT';
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS contact_log (
        ${this.pk},
        name    ${vc(100)},
        email   ${vc(200)},
        phone   ${vc(50)},
        message TEXT,
        c_date  ${vc(20)},
        c_time  ${vc(20)}
      )
    `);
  }

  private getNow() {
    const now = new Date();
    return { date: now.toISOString().slice(0, 10), time: now.toTimeString().slice(0, 8) };
  }

  async send(dto: { name: string; email: string; phone?: string; message: string }): Promise<void> {
    const { date, time } = this.getNow();

    // DB 저장
    await this.query(
      `INSERT INTO contact_log (name, email, phone, message, c_date, c_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [dto.name, dto.email, dto.phone ?? '', dto.message, date, time],
    );

    // 이메일 발송
    if (!this.resend) {
      console.warn('[Contact] RESEND_API_KEY 미설정 — 이메일 발송 생략');
      return;
    }

    const { error } = await this.resend.emails.send({
      from:    'onboarding@resend.dev',
      to:      [TO_EMAIL],
      subject: `[문의] ${dto.name} 님의 메시지`,
      html: `
        <h3>새 문의가 도착했습니다</h3>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">이름</td><td style="padding:8px;border:1px solid #ddd">${dto.name}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">이메일</td><td style="padding:8px;border:1px solid #ddd">${dto.email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">전화번호</td><td style="padding:8px;border:1px solid #ddd">${dto.phone || '-'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">메시지</td><td style="padding:8px;border:1px solid #ddd;white-space:pre-wrap">${dto.message}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">전송일시</td><td style="padding:8px;border:1px solid #ddd">${date} ${time}</td></tr>
        </table>
      `,
    });

    if (error) throw new InternalServerErrorException('이메일 발송에 실패했습니다.');
  }

  async findAll(): Promise<any[]> {
    return this.dataSource.query('SELECT * FROM contact_log ORDER BY id DESC');
  }
}
