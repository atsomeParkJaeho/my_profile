import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, Patch, Post, Put, Req } from '@nestjs/common';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // ── myself_info ──
  @Get('info')
  getInfo(@Req() req: any) {
    return this.profileService.getInfo(req.session?.userId);
  }

  @Put('info')
  updateInfo(@Body() dto: any) {
    return this.profileService.updateInfo(dto);
  }

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
  @Get('careers')
  getCareers() {
    return this.profileService.getCareers();
  }

  @Post('careers')
  createCareer(@Body() dto: any) {
    return this.profileService.createCareer(dto);
  }

  @Put('careers/:id')
  updateCareer(@Param('id') id: string, @Body() dto: any) {
    return this.profileService.updateCareer(Number(id), dto);
  }

  @Delete('careers/:id')
  deleteCareer(@Param('id') id: string) {
    return this.profileService.deleteCareer(Number(id));
  }
}
