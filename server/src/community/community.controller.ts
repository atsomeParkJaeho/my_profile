import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CommunityService } from './community.service';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // type별 목록 조회: GET /api/community/list/:type
  @Get('list/:type')
  findByType(@Param('type') type: string) {
    return this.communityService.findByType(type);
  }

  // 전체 목록 (하위 호환)
  @Get('list')
  findAll() {
    return this.communityService.findAll();
  }

  @Get('detail/:id')
  findOne(@Param('id') id: string) {
    return this.communityService.findOne(Number(id));
  }

  @Post('create')
  create(@Body() dto: any) {
    return this.communityService.create(dto);
  }

  @Put('update/:id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.communityService.update(Number(id), dto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.communityService.remove(Number(id));
  }
}
