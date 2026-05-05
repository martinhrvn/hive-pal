import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { HiveScaleController } from './hivescale.controller';
import { HiveScaleService } from './hivescale.service';

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [HiveScaleController],
  providers: [HiveScaleService],
})
export class HiveScaleModule {}
