import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { OttService } from './ott.service';

/* swagger에 노출 되는 소스 */
@ApiTags('OTT 애니메이션')
@Controller('ott')
export class OttController {
  constructor(private readonly ottService: OttService) {}

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: 'OTT 애니메이션 목록 조회 (검색어/분기 필터)' })
  @ApiQuery({ name: 'q', required: false, description: '제목 검색어' })
  @ApiQuery({ name: 'quarter', required: false, description: '방영분기', example: '4분기' })
  @ApiResponse({ status: 200, description: '목록 배열' })
  @Get('list')
  findAll(@Query('q') q?: string, @Query('quarter') quarter?: string) {
    return this.ottService.findAll(q, quarter);
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: 'OTT 애니메이션 상세 조회' })
  @ApiParam({ name: 'id', description: 'ID' })
  @ApiResponse({ status: 200, description: '상세 정보' })
  @Get('detail/:id')
  findOne(@Param('id') id: string) {
    return this.ottService.findOne(Number(id));
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: 'OTT 애니메이션 생성' })
  @ApiBody({ schema: { example: { title: '제목', year: '2026', quarter: '4분기', image: '', netflixLink: '', laftelLink: '', wavveLink: '', watchaLink: '', tvingLink: '', coupangplayLink: '' } } })
  @ApiResponse({ status: 201, description: '생성된 항목' })
  @Post('create')
  create(@Body() dto: any) {
    return this.ottService.create(dto);
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: 'OTT 애니메이션 수정' })
  @ApiParam({ name: 'id', description: 'ID' })
  @ApiResponse({ status: 200, description: '수정된 항목' })
  @Put('update/:id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.ottService.update(Number(id), dto);
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: 'OTT 애니메이션 삭제' })
  @ApiParam({ name: 'id', description: 'ID' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.ottService.remove(Number(id));
  }
}
