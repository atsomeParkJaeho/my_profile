import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // ── myself_info ──
  @Get('info')
  getInfo() {
    return this.profileService.getInfo();
  }

  @Put('info')
  updateInfo(@Body() dto: any) {
    return this.profileService.updateInfo(dto);
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
