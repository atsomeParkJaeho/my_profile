import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, Patch, Post, Put, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { ProfileService } from './profile.service';

/* swagger에 노출 되는 소스 */
@ApiTags('프로필')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // ── myself_info ──
  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '프로필 정보 조회' })
  @ApiResponse({ status: 200, description: 'myself_info 레코드' })
  @Get('info')
  getInfo(@Req() req: any) {
    return this.profileService.getInfo(req.session?.userId);
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '프로필 정보 수정' })
  @ApiBody({ schema: { example: { name: '홍길동', intro: '소개', phone: '010-0000-0000', location: '서울', website: 'https://example.com', tech: 'TypeScript, React', org: '회사명' } } })
  @ApiResponse({ status: 200, description: '수정된 프로필' })
  @Put('info')
  updateInfo(@Body() dto: any) {
    return this.profileService.updateInfo(dto);
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '프로필 이미지 변경 (관리자 전용)' })
  @ApiCookieAuth()
  @ApiBody({ schema: { example: { profileImage: 'data:image/png;base64,...' } } })
  @ApiResponse({ status: 200, description: '{ ok: true }' })
  @ApiResponse({ status: 403, description: '관리자 권한 필요' })
  @Patch('profile-image')
  @HttpCode(200)
  async updateProfileImage(@Body() body: { profileImage: string }, @Req() req: any) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || req.session?.email !== adminEmail) {
      throw new ForbiddenException('관리자만 프로필 이미지를 변경할 수 있습니다.');
    }
    await this.profileService.updateProfileImage(body.profileImage);
    return { ok: true };
  }

  // ── career_list ──
  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '경력 목록 조회' })
  @ApiResponse({ status: 200, description: '경력 배열' })
  @Get('careers')
  getCareers() {
    return this.profileService.getCareers();
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '경력 추가' })
  @ApiBody({ schema: { example: { company: '회사명', role: '직책', start_dt: '2020-01', end_dt: '2023-12', desc: '업무 설명', order_no: 1 } } })
  @ApiResponse({ status: 201, description: '추가된 경력' })
  @Post('careers')
  createCareer(@Body() dto: any) {
    return this.profileService.createCareer(dto);
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '경력 수정' })
  @ApiParam({ name: 'id', description: '경력 ID' })
  @ApiResponse({ status: 200, description: '수정된 경력' })
  @Put('careers/:id')
  updateCareer(@Param('id') id: string, @Body() dto: any) {
    return this.profileService.updateCareer(Number(id), dto);
  }

  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '경력 삭제' })
  @ApiParam({ name: 'id', description: '경력 ID' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @Delete('careers/:id')
  deleteCareer(@Param('id') id: string) {
    return this.profileService.deleteCareer(Number(id));
  }
}
