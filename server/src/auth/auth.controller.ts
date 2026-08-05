import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
// import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { SessionAuthGuard } from './guards/session-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 회원가입 비활성화
  // @Post('signup')
  // signup(@Body() dto: SignupDto) {
  //   return this.authService.signup(dto);
  // }

  // POST /api/auth/login
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const result = await this.authService.login(dto, req.session);
    // onSend 자동저장에 의존하지 않고 명시적으로 저장
    await req.session.save();
    return result;
  }

  // POST /api/auth/logout  (세션 파기)
  @Post('logout')
  @HttpCode(204)
  @UseGuards(SessionAuthGuard)
  logout(@Req() req: any) {
    return this.authService.logout(req.session);
  }

  // GET /api/auth/me  (현재 로그인 유저 확인 — 새로고침 시 세션 체크용)
  @Get('me')
  @UseGuards(SessionAuthGuard)
  me(@Req() req: any) {
    return {
      id:    req.session.userId,
      name:  req.session.name,
      email: req.session.email,
    };
  }

  // DELETE /api/auth/me  (회원탈퇴)
  @Delete('me')
  @HttpCode(204)
  @UseGuards(SessionAuthGuard)
  withdraw(@Req() req: any) {
    return this.authService.withdraw(req.session.userId, req.session);
  }
}
