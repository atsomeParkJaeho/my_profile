/**
 * 굿스마일컴퍼니_pw 스마트스토어 HTML 파싱 구조 확인
 * 실행: npx ts-node src/pricefind/pricefind.test.ts
 */

import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

const TARGET_URL = 'https://smartstore.naver.com/gsc_korea_dt_pw';

async function run() {
  console.log(`\n접속 URL: ${TARGET_URL}\n`);

  let browser!: puppeteer.Browser;
  try {
    browser = await (puppeteer as any).default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'
    );
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    console.log('페이지 로딩 중...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('body', { timeout: 10000 });
    const html = await page.content();
    const $    = cheerio.load(html);

    console.log(html,'/[html]')
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
  } finally {
    await browser?.close();
  }
}

run();
