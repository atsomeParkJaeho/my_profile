import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as cheerio from 'cheerio';

@Injectable()
export class PricefindService {
  private readonly DEFAULT_BASE_URL = 'https://m.brand.naver.com/bandai';

  async searchNaver(q: string, baseUrl?: string): Promise<any> {
    const base = baseUrl ?? this.DEFAULT_BASE_URL;
    const url = `${base}/search?q=${encodeURIComponent(q)}`;
    const isProd = process.env.NODE_ENV === 'production';

    let browser: any;

    if (isProd) {
      // ── 프로덕션(Render): sparticuz/chromium + puppeteer-core ──
      const puppeteer = await import('puppeteer-core');
      const chromium  = await import('@sparticuz/chromium');
      browser = await puppeteer.default.launch({
        headless: true,
        executablePath: await chromium.default.executablePath(),
        args: chromium.default.args,
      });
    } else {
      // ── 로컬(개발): 일반 puppeteer ──
      const puppeteer = await import('puppeteer');
      browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
      });
    }

    try {
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'
      );
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
      await page.waitForSelector('body', { timeout: 10000 });

      const html = await page.content();
      const items = this.parseItems(html);
      return { items, total: items.length };
    } catch (err: any) {
      throw new HttpException(
        err?.message ?? 'puppeteer fetch failed',
        HttpStatus.BAD_GATEWAY,
      );
    } finally {
      await browser.close().catch(() => null);
    }
  }

  private parseItems(html: string) {
    const $ = cheerio.load(html);
    const results: { title: string; img: string; price: number; yen: number; html: string }[] = [];

    $('*').each((_, el) => {
      const $el = $(el);
      const hasStrong = $el.find('strong').length > 0;
      const hasImg    = $el.find('img').length > 0;
      if (!hasStrong || !hasImg) return;

      const childAlsoMatches = $el.children().toArray().some((child) => {
        const $c = $(child);
        return $c.find('strong').length > 0 && $c.find('img').length > 0;
      });
      if (childAlsoMatches) return;

      const title = $el.find('strong').first().text().trim();
      if (title === '개인정보처리방침') return;

      const target = $el.find('.TZ9pAJh_Sk');
      const yen = this.toNumber(target.first().text()) / 12;

      results.push({
        title,
        img:   ($el.find('img').first().attr('src') ?? '').replace('?type=f80_80', '?type=f750_750'),
        price: target.length > 0 ? this.toNumber(target.first().text()) : 0,
        yen,
        html:  $.html(el),
      });
    });

    return results;
  }

  private toNumber(value: string): number {
    return Number(value.replace(/,/g, '').trim()) || 0;
  }
}
