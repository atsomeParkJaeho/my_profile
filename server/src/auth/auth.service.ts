import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async signup(dto: SignupDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('?´ë? ?±ë¡???´ë©”?¼ì…?ˆë‹¤.');

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
    if (!user || !user.password) throw new UnauthorizedException('?´ë©”???ëŠ” ë¹„ë?ë²ˆí˜¸ê°€ ?¬ë°”ë¥´ì? ?ŠìŠµ?ˆë‹¤.');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('?´ë©”???ëŠ” ë¹„ë?ë²ˆí˜¸ê°€ ?¬ë°”ë¥´ì? ?ŠìŠµ?ˆë‹¤.');

    // ?¸ì…˜??? ì? ?•ë³´ ?€??(?œë²„ ë©”ëª¨ë¦¬ì— ë³´ê?, ë¸Œë¼?°ì???session ID ì¿ í‚¤ë§??„ë‹¬)
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
