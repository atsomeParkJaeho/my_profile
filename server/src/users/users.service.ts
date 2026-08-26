import { Injectable, ConflictException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    const email    = process.env.ADMIN_EMAIL;
    const name     = process.env.ADMIN_NAME;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !name || !password) {
      console.warn('[Init] Í¥ÄÎ¶¨Ïûê Í≥ÑÏ†ï ?òÍ≤ΩÎ≥Ä??ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD)Í∞Ä ?§Ï†ï?òÏ? ?äÏïÑ Ï¥àÍ∏∞ Í≥ÑÏ†ï???ùÏÑ±?òÏ? ?äÏäµ?àÎã§.');
      return;
    }
    const exists = await this.usersRepository.findOne({ where: { email } });
    if (!exists) {
      const hashed = await bcrypt.hash(password, 10);
      await this.usersRepository.save(
        this.usersRepository.create({ name, email, password: hashed }),
      );
      console.log(`[Init] Í¥ÄÎ¶¨Ïûê Í≥ÑÏ†ï ?ùÏÑ± ?ÑÎ£å: ${email}`);
    }
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { id: 'DESC' } });
  }

  // password Ïª¨Îüº?Ä select:false ?¥Î?Î°?Î™ÖÏãú?ÅÏúºÎ°??¨Ìï®
  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('?¥Î? ?±Î°ù???¥Î©î?ºÏûÖ?àÎã§.');
    }
    const user = this.usersRepository.create(dto);
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
