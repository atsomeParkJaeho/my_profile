import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/user.entity';
import { CommunityModule } from './community/community.module';
import { ProfileModule } from './profile/profile.module';
import { CommentModule } from './comment/comment.module';
import { ContactModule } from './contact/contact.module';
import { PricefindModule } from './pricefind/pricefind.module';

// DB_HOST 환경변수 유무로 PostgreSQL / SQLite 자동 선택
const dbConfig = process.env.DB_HOST
  ? {
      type: 'postgres' as const,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASS ?? '',
      database: process.env.DB_NAME ?? 'appdb',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
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
    CommentModule,
    ContactModule,
    PricefindModule,
  ],
})
export class AppModule {}
