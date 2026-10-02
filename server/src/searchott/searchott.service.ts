import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class SearchottService {
  // 2026년 4분기 일본 애니메이션 분류 (나무위키)
  private readonly CATEGORY_URL =
    'https://namu.wiki/w/%EB%B6%84%EB%A5%98:2026%EB%85%84%204%EB%B6%84%EA%B8%B0%20%EC%9D%BC%EB%B3%B8%20%EC%95%A0%EB%8B%88%EB%A9%94%EC%9D%B4%EC%85%98';

  private readonly MOBILE_USER_AGENT =
    'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';

  async searchNamu(q?: string): Promise<any> {
    let html: string;
    try {
      const { data } = await axios.get<string>(this.CATEGORY_URL, {
        headers: { 'User-Agent': this.MOBILE_USER_AGENT },
        timeout: 15000,
      });
      html = data;
    } catch (err: any) {
      throw new HttpException(
        err?.message ?? '나무위키 크롤링 실패',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const items = this.parseItems(html);
    const filtered = q ? items.filter((item) => item.title.includes(q)) : items;

    return { items: filtered, total: filtered.length };
  }

  private parseItems(html: string) {
    const $ = cheerio.load(html);
    const results: { title: string; link: string }[] = [];
    const seen = new Set<string>();

    // "하위 분류"를 제외한 실제 문서 목록(#category-문서)만 파싱
    $('#category-문서 li a[title]').each((_, el) => {
      const $el = $(el);
      const title = ($el.attr('title') ?? $el.text()).trim();
      const href = $el.attr('href') ?? '';
      if (!title || !href || seen.has(title)) return;
      seen.add(title);

      results.push({
        title,
        link: `https://namu.wiki${href}`,
      });
    });

    return results;
  }
}
