import { Injectable, ConflictException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
const ADMIN_NAME     = process.env.ADMIN_NAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onApplicationBootstrap() {
    if (!ADMIN_EMAIL || !ADMIN_NAME || !ADMIN_PASSWORD) {
      console.warn('[Init] 관리자 계정 환경변수(ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD)가 설정되지 않아 초기 계정을 생성하지 않습니다.');
      return;
    }
    const exists = await this.usersRepository.findOne({ where: { email: ADMIN_EMAIL } });
    if (!exists) {
      const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await this.usersRepository.save(
        this.usersRepository.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: hashed }),
      );
      console.log(`[Init] 관리자 계정 생성 완료: ${ADMIN_EMAIL}`);
    }
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { id: 'DESC' } });
  }

  // password 컬럼은 select:false 이므로 명시적으로 포함
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
      throw new ConflictException('이미 등록된 이메일입니다.');
    }
    const user = this.usersRepository.create(dto);
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  // auth_user 테이블 전체 조회
  async findAuthUsers(): Promise<any[]> {
    return this.dataSource.query(
      'SELECT * FROM auth_user',
    );
  }

  // auth_user 단건 조회
  async findAuthUserById(id: number): Promise<any[]> {
    return this.dataSource.query(
      'SELECT * FROM auth_user WHERE id = ?',
      [id],
    );
  }
}
