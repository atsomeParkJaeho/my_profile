/**
 * 굿스마일컴퍼니_pw 스마트스토어 HTML 파싱 구조 확인
 * 실행: npx ts-node src/pricefind/pricefind.test.ts
 */

import { PlaywrightCrawler } from 'crawlee';
import * as cheerio from 'cheerio';

const TARGET_URL = 'https://m.smartstore.naver.com/gsc_korea_dt_pw';

async function run() {
  console.log(`\n접속 URL: ${TARGET_URL}\n`);

  let html = '';

  const crawler = new PlaywrightCrawler({
    maxRequestRetries: 2,
    maxConcurrency: 1,
    requestHandlerTimeoutSecs: 40,
    launchContext: {
      userAgent:
        'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
    },
    preNavigationHooks: [
      async ({ page }) => {
        const delayMs = 2000 + Math.random() * 2000; // 2~4초 랜덤 딜레이
        console.log(`요청 전 대기: ${(delayMs / 1000).toFixed(1)}초`);
        await new Promise((r) => setTimeout(r, delayMs));

        await page.addInitScript(() => {
          Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });
      },
    ],
    requestHandler: async ({ page }) => {
      console.log('페이지 로딩 중...');
      await page.waitForSelector('body', { timeout: 10000 });
      html = await page.content();
    },
  });

  try {
    await crawler.run([TARGET_URL]);

    const $ = cheerio.load(html);
    console.log(html, '/[html]');
    console.log(`HTML 길이: ${html.length} bytes\n`);
    console.log('='.repeat(60));

    // ── 1. <strong> 태그 텍스트 목록 ──────────────────────────
    console.log('\n[1] <strong> 태그 텍스트 (상위 20개)');
    console.log('-'.repeat(40));
    let count = 0;
    $('strong').each((_, el) => {
      if (count >= 20) return;
      const text = $(el).text().trim();
      if (text) { console.log(`  "${text}"`); count++; }
    });

    // ── 2. 가격 셀렉터 확인 ────────────────────────────────────
    console.log('\n[2] 가격 셀렉터 (.TZ9pAJh_Sk)');
    console.log('-'.repeat(40));
    const priceEls = $('.TZ9pAJh_Sk');
    console.log(`  발견: ${priceEls.length}개`);
    priceEls.slice(0, 5).each((_, el) => {
      console.log(`  → "${$(el).text().trim()}"`);
    });

    // ── 3. img 태그 src 목록 ──────────────────────────────────
    console.log('\n[3] <img> src 목록 (상위 10개)');
    console.log('-'.repeat(40));
    let imgCount = 0;
    $('img').each((_, el) => {
      if (imgCount >= 10) return;
      const src = $(el).attr('src') ?? '';
      if (src) { console.log(`  ${src.slice(0, 100)}`); imgCount++; }
    });

    // ── 4. strong + img 동시 포함 요소 ───────────────────────
    console.log('\n[4] <strong> + <img> 동시 포함 요소 (상위 5개)');
    console.log('-'.repeat(40));
    let matchCount = 0;
    $('*').each((_, el) => {
      if (matchCount >= 5) return;
      const $el = $(el);
      if ($el.find('strong').length === 0 || $el.find('img').length === 0) return;

      const childAlsoMatches = $el.children().toArray().some((child) => {
        const $c = $(child);
        return $c.find('strong').length > 0 && $c.find('img').length > 0;
      });
      if (childAlsoMatches) return;

      const title = $el.find('strong').first().text().trim();
      const img   = $el.find('img').first().attr('src') ?? '';
      const price = $el.find('.TZ9pAJh_Sk').first().text().trim();
      console.log(`  제목  : ${title}`);
      console.log(`  이미지: ${img.slice(0, 80)}`);
      console.log(`  가격  : ${price || '(셀렉터 미매칭)'}`);
      console.log();
      matchCount++;
    });

    if (matchCount === 0) {
      console.log('  → 매칭 요소 없음. 셀렉터 수정 필요');
    }

    console.log('='.repeat(60));

  } catch (err: any) {
    console.error('오류:', err?.message ?? err);
  }
}

run();
