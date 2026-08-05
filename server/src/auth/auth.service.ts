import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async signup(dto: SignupDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('이미 등록된 이메일입니다.');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashed,
    });

    return { id: user.id, name: user.name, email: user.email };
  }

  async login(dto: LoginDto, session: any) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.password) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    // 세션에 유저 정보 저장 (서버 메모리에 보관, 브라우저엔 session ID 쿠키만 전달)
    session.userId = user.id;
    session.name   = user.name;
    session.email  = user.email;

    return { name: user.name, email: user.email };
  }

  async logout(session: any): Promise<void> {
    await session.destroy();
  }

  async withdraw(userId: number, session: any): Promise<void> {
    await this.usersService.remove(userId);
    await session.destroy();
  }
}
