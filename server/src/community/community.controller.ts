import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CommunityService } from './community.service';

/* swagger에 노출 되는 소스 */
@ApiTags('커뮤니티')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // 1차(layout) + 2차(type) 목록 조회: GET /api/community/list/:layout/:type
  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '레이아웃+타입별 게시물 목록 조회' })
  @ApiParam({ name: 'layout', description: '게시판 레이아웃' })
  @ApiParam({ name: 'type', description: '게시물 타입' })
  @ApiResponse({ status: 200, description: '게시물 배열' })
  @Get('list/:layout/:type')
  findByLayoutAndType(@Param('layout') layout: string, @Param('type') type: string) {
    return this.communityService.findByLayoutAndType(layout, type);
  }

  // 전체 목록 (하위 호환)
  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '전체 게시물 목록 조회' })
  @ApiResponse({ status: 200, description: '게시물 배열' })
  @Get('list')
  findAll() {
    return this.communityService.findAll();
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '게시물 상세 조회' })
  @ApiParam({ name: 'id', description: '게시물 ID' })
  @ApiResponse({ status: 200, description: '게시물 상세' })
  @Get('detail/:id')
  findOne(@Param('id') id: string) {
    return this.communityService.findOne(Number(id));
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '게시물 생성' })
  @ApiBody({ schema: { example: { title: '제목', content: '내용', type: 'notice', board_layout: 'blog', c_user_name: '관리자' } } })
  @ApiResponse({ status: 201, description: '생성된 게시물' })
  @Post('create')
  create(@Body() dto: any) {
    return this.communityService.create(dto);
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '게시물 수정' })
  @ApiParam({ name: 'id', description: '게시물 ID' })
  @ApiResponse({ status: 200, description: '수정된 게시물' })
  @Put('update/:id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.communityService.update(Number(id), dto);
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '게시물 삭제' })
  @ApiParam({ name: 'id', description: '게시물 ID' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.communityService.remove(Number(id));
  }
}
