import { Module } from '@nestjs/common';
import { PricefindService } from './pricefind.service';
import { PricefindController } from './pricefind.controller';

@Module({
  providers: [PricefindController, PricefindService],
  controllers: [PricefindController],
})
export class PricefindModule {}
