import { Module } from '@nestjs/common';
import { SearchottService } from './searchott.service';
import { SearchottController } from './searchott.controller';

@Module({
  providers: [SearchottController, SearchottService],
  controllers: [SearchottController],
})
export class SearchottModule {}
