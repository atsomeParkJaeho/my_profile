import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

@Injectable()
export class PricefindService {
  async searchNaver(q: string): Promise<any> {
    const url = `https://m.brand.naver.com/bandai/search?q=${encodeURIComponent(q)}`;

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

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
      await browser.close();
    }
  }

  private parseItems(html: string) {
    const $ = cheerio.load(html);
    const results: { title: string; img: string; price: number; yen: number; html: string }[] = [];

    // <strong> 과 <img> 를 모두 포함하는 요소만 추출
    $('*').each((_, el) => {
      const $el = $(el);
      const hasStrong = $el.find('strong').length > 0;
      const hasImg    = $el.find('img').length > 0;
      if (!hasStrong || !hasImg) return;

      // 자식 중에도 동일 조건을 만족하는 요소가 있으면 더 작은 단위(자식)가 담당하므로 스킵
      const childAlsoMatches = $el.children().toArray().some((child) => {
        const $c = $(child);
        return $c.find('strong').length > 0 && $c.find('img').length > 0;
      });
      if (childAlsoMatches) return;

      const target = $el.find('.TZ9pAJh_Sk');
      const yen = this.toNumber(target.first().text()) / 12;

      results.push({
        title: $el.find('strong').first().text().trim(),
        img:   $el.find('img').first().attr('src') ?? '',
        price: target.length > 0 ? this.toNumber(target.first().text()) : 0,
        html:  $.html(el),
        yen:yen,
      });
    });

    return results;
  }

  private toNumber(value: string): number {
    return Number(value.replace(/,/g, '').trim()) || 0;
  }
}
