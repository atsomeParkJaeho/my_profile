import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(Number(id));
  }

  @Patch('profile-image')
  @HttpCode(200)
  @UseGuards(SessionAuthGuard)
  async updateProfileImage(@Body() body: { profileImage: string }, @Req() req: any) {
    await this.usersService.updateProfileImage(req.session.userId, body.profileImage);
    return { ok: true };
  }
}
