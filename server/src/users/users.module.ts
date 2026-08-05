import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],        // 테이블
  controllers: [UsersController],                     // api 경로
  providers: [UsersService],                          // 쿼리문
  exports: [UsersService],                            // 해당경로 쿼리문 외부에서도 쓰게끔 설정
})
export class UsersModule {}
