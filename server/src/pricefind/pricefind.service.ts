import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PlaywrightCrawler } from '@crawlee/playwright';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

const isPkg = typeof (process as any).pkg !== 'undefined';

function findLocalChrome(): string {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    `${process.env.LOCALAPPDATA}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  throw new Error(
    'Chrome 또는 Edge를 찾을 수 없습니다.\n' +
    'Google Chrome을 설치한 후 다시 시도해주세요.\n' +
    'https://www.google.com/chrome'
  );
}

@Injectable()
export class PricefindService {
  private readonly DEFAULT_BASE_URL = 'https://m.brand.naver.com/bandai';

  async searchNaver(q: string, baseUrl?: string): Promise<any> {
    const base = baseUrl ?? this.DEFAULT_BASE_URL;

    // 건담붐(gundamboom)은 네이버 브랜드스토어와 검색 방식/마크업이 달라 별도 분기 처리
    if (/gundamboom/i.test(base)) {
      return this.searchGundamboom(q, base);
    }

    const url = `${base}/search?q=${encodeURIComponent(q)}`;
    const isProd = process.env.NODE_ENV === 'production';

    let html = '';
    let crawlError: string | null = null;

    const launchContext = await this.buildLaunchContext(isProd);

    const crawler = new PlaywrightCrawler({
      ...launchContext,
      maxRequestRetries: 2,
      maxConcurrency: 1,
      requestHandlerTimeoutSecs: 30,
      preNavigationHooks: [
        async ({ page }) => {
          await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
          });
        },
      ],
      requestHandler: async ({ page }) => {
        await page.waitForSelector('body', { timeout: 10000 });
        html = await page.content();
      },
      failedRequestHandler: async ({ request, error }: any) => {
        crawlError = error?.message ?? '크롤링 실패';
      },
    });

    try {
      // 동일 검색어를 반복 요청해도 crawlee 요청 큐가 중복으로 판단하지 않도록 고유 uniqueKey 부여
      await crawler.run([{ url, uniqueKey: `${url}#${Date.now()}` }]);
    } catch (err: any) {
      throw new HttpException(
        err?.message ?? 'crawlee fetch failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (crawlError) {
      throw new HttpException(crawlError, HttpStatus.BAD_GATEWAY);
    }

    if (!html) {
      throw new HttpException('페이지 로드 실패', HttpStatus.BAD_GATEWAY);
    }

    const items = this.parseItems(html);
    return { items, total: items.length, html };
  }

  // ── 건담붐(gundamboom): #search_keyword input을 채운 뒤 #sc 폼을 POST로 제출하는 방식 ──
  private async searchGundamboom(q: string, base: string): Promise<any> {
    const url = `${base}/product/list.php?mode=view`;
    const isProd = process.env.NODE_ENV === 'production';

    let html = '';
    let crawlError: string | null = null;

    const launchContext = await this.buildLaunchContext(isProd);

    const crawler = new PlaywrightCrawler({
      ...launchContext,
      maxRequestRetries: 2,
      maxConcurrency: 1,
      requestHandlerTimeoutSecs: 30,
      preNavigationHooks: [
        async ({ page }) => {
          await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
          });
        },
      ],
      requestHandler: async ({ page }) => {
        // 검색창(#search_keyword)은 숨김 처리되어 있어 attached 상태만 확인
        await page.waitForSelector('#search_keyword', { state: 'attached', timeout: 10000 });
        await page.evaluate((keyword: string) => {
          const input = document.getElementById('search_keyword') as HTMLInputElement;
          input.value = keyword;
          (document.getElementById('sc') as HTMLFormElement).submit();
        }, q);
        // 같은 URL로 POST 재요청되므로 결과 목록(.item)이 렌더링될 때까지 대기
        await page.waitForSelector('.item, .empty, .no_data', { timeout: 15000 }).catch(() => {});
        html = await page.content();
      },
      failedRequestHandler: async ({ request, error }: any) => {
        crawlError = error?.message ?? '크롤링 실패';
      },
    });

    try {
      // 검색어와 무관하게 URL이 항상 동일(POST 검색)해 crawlee의 요청 큐가 중복으로
      // 판단해 2번째 검색부터 건너뛰는 것을 방지하기 위해 매번 고유한 uniqueKey 부여
      await crawler.run([{ url, uniqueKey: `${url}#${q}#${Date.now()}` }]);
    } catch (err: any) {
      throw new HttpException(
        err?.message ?? 'crawlee fetch failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (crawlError) {
      throw new HttpException(crawlError, HttpStatus.BAD_GATEWAY);
    }

    if (!html) {
      throw new HttpException('페이지 로드 실패', HttpStatus.BAD_GATEWAY);
    }

    const items = this.parseGundamboomItems(html);
    return { items, total: items.length, html };
  }

  private readonly MOBILE_USER_AGENT =
    'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';

  private async buildLaunchContext(isProd: boolean) {
    // Electron utilityProcess 또는 pkg 환경 → 시스템 Chrome 사용
    const isElectron = !!(process.versions as any).electron;
    if (isPkg || isElectron) {
      const { chromium } = require('playwright-core');
      return {
        launchContext: {
          launcher: chromium,
          userAgent: this.MOBILE_USER_AGENT,
          launchOptions: {
            headless: true,
            executablePath: findLocalChrome(),
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
          },
        },
      };
    }

    if (isProd) {
      // 서버리스 환경(Lambda 등)에서만 @sparticuz/chromium 사용
      const { chromium } = await import('playwright-core');
      const sparticuzChromium = await import('@sparticuz/chromium');
      return {
        launchContext: {
          launcher: chromium,
          userAgent: this.MOBILE_USER_AGENT,
          launchOptions: {
            headless: true,
            executablePath: await sparticuzChromium.default.executablePath(),
            args: sparticuzChromium.default.args,
          },
        },
      };
    }

    // 로컬 개발: crawlee 기본 playwright(chromium) 사용
    return {
      launchContext: {
        userAgent: this.MOBILE_USER_AGENT,
        launchOptions: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
        },
      },
    };
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

  // 건담붐: .item(썸네일 .item_thm img, 제목은 잘림 없는 img[alt], 가격 .price_area .step1 strong)
  private parseGundamboomItems(html: string) {
    const $ = cheerio.load(html);
    const results: { title: string; img: string; price: number; yen: number; html: string }[] = [];

    $('.item').each((_, el) => {
      const $el = $(el);
      const img = $el.find('.item_thm img').first();
      const title = (img.attr('alt') ?? $el.find('.item_info .title a').first().text()).trim();
      if (!title) return;

      const priceText = $el.find('.price_area .step1 strong').first().text();

      results.push({
        title,
        img:   img.attr('src') ?? '',
        price: this.toNumber(priceText),
        yen:   0,
        html:  $.html(el),
      });
    });

    return results;
  }

  private toNumber(value: string): number {
    return Number(value.replace(/[^\d.]/g, '')) || 0;
  }
}
