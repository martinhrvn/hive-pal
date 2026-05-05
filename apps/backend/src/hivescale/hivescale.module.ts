import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { HiveScaleController } from './hivescale.controller';
import { HiveScaleService } from './hivescale.service';

@Module({
  imports: [AuthModule, ConfigModule, UsersModule],
  controllers: [HiveScaleController],
  providers: [HiveScaleService],
})
export class HiveScaleModule {}
