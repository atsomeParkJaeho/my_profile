import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/user.entity';
import { CommunityModule } from './community/community.module';
import { ProfileModule } from './profile/profile.module';

// DB_HOST 환경변수 유무로 MariaDB / SQLite 자동 선택
const dbConfig = process.env.DB_HOST
  ? {
      type: 'mysql' as const,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASS ?? '',
      database: process.env.DB_NAME ?? 'appdb',
    }
  : {
      type: 'better-sqlite3' as const,
      database: process.env.DB_PATH ?? 'db.sqlite',
    };

@Module({
  imports: [
    // .env 파일 자동 로드 (NODE_ENV 기반 분기)
    ConfigModule.forRoot({
      isGlobal: true,
      // NODE_ENV=production → .env.prod, 나머지 → .env.dev
      envFilePath: [
        process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev',
        '.env',
      ],
    }),
    TypeOrmModule.forRoot({
      ...dbConfig,
      entities: [User],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    CommunityModule,
    ProfileModule,
  ],
})
export class AppModule {}
