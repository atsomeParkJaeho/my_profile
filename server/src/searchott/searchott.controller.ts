import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchottService } from './searchott.service';

/* swagger에 노출 되는 소스 */
@ApiTags('OTT 정보 검색')
@Controller('searchott')
export class SearchottController {
  constructor(private readonly searchottService: SearchottService) {}

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '나무위키 분류:2026년 4분기 일본 애니메이션 검색 (크롤링)' })
  @ApiQuery({ name: 'q', required: false, description: '검색어', example: '던전' })
  @ApiResponse({ status: 200, description: '{ items: [...], total: number }' })
  @Get('search')
  search(@Query('q') q?: string) {
    return this.searchottService.searchNamu(q?.trim());
  }
}
