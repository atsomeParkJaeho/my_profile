import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { PricefindService } from './pricefind.service';

@Controller('pricefind')
export class PricefindController {
  constructor(private readonly pricefindService: PricefindService) {}

  // GET /api/pricefind/search?q=건담
  @Get('search')
  search(@Query('q') q: string, @Query('url') url?: string) {
    if (!q?.trim()) throw new BadRequestException('검색어(q)를 입력해주세요.');
    return this.pricefindService.searchNaver(q.trim(), url?.trim());
  }
}
