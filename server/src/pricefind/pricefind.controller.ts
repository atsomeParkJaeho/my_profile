import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PricefindService } from './pricefind.service';

/* swagger에 노출 되는 소스 */
@ApiTags('가격 검색')
@Controller('pricefind')
export class PricefindController {
  constructor(private readonly pricefindService: PricefindService) {}

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '네이버 브랜드 상품 검색 (크롤링)' })
  @ApiQuery({ name: 'q', description: '검색어', example: '건담' })
  @ApiQuery({ name: 'url', required: false, description: '브랜드 기본 URL (기본값: 반달 네이버 브랜드)', example: 'https://m.brand.naver.com/bandai' })
  @ApiResponse({ status: 200, description: '{ items: [...], total: number, html: string }' })
  @ApiResponse({ status: 400, description: '검색어 누락' })
  @Get('search')
  search(@Query('q') q: string, @Query('url') url?: string) {
    if (!q?.trim()) throw new BadRequestException('검색어(q)를 입력해주세요.');
    return this.pricefindService.searchNaver(q.trim(), url?.trim());
  }
}
