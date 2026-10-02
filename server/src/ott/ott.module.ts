import { Module } from '@nestjs/common';
import { OttService } from './ott.service';
import { OttController } from './ott.controller';

@Module({
  providers: [OttService],
  controllers: [OttController],
})
export class OttModule {}
