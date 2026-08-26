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
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
// import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { SessionAuthGuard } from './guards/session-auth.guard';

/* swagger에 노출 되는 소스 */
@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 회원가입 비활성화
  // @Post('signup')
  // signup(@Body() dto: SignupDto) {
  //   return this.authService.signup(dto);
  // }

  // POST /api/auth/login
  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공, 세션 쿠키 발급' })
  @ApiResponse({ status: 401, description: '이메일 또는 비밀번호 불일치' })
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const result = await this.authService.login(dto, req.session);
    // onSend 자동저장에 의존하지 않고 명시적으로 저장
    await req.session.save();
    return result;
  }

  // POST /api/auth/logout  (세션 파기)
  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '로그아웃' })
  @ApiCookieAuth()
  @ApiResponse({ status: 204, description: '로그아웃 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @Post('logout')
  @HttpCode(204)
  @UseGuards(SessionAuthGuard)
  logout(@Req() req: any) {
    return this.authService.logout(req.session);
  }

  // GET /api/auth/me  (현재 로그인 유저 확인 — 새로고침 시 세션 체크용)
  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '현재 로그인 유저 조회' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: '{ id, name, email }' })
  @ApiResponse({ status: 401, description: '인증 필요' })
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
  /* swagger에 노출 되는 소스 */
  @ApiOperation({ summary: '회원탈퇴' })
  @ApiCookieAuth()
  @ApiResponse({ status: 204, description: '탈퇴 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @Delete('me')
  @HttpCode(204)
  @UseGuards(SessionAuthGuard)
  withdraw(@Req() req: any) {
    return this.authService.withdraw(req.session.userId, req.session);
  }
}
