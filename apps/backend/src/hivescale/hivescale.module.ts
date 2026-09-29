import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { PrismaService } from '../prisma/prisma.service';
import { HiveScaleController } from './hivescale.controller';
import { HiveScaleService } from './hivescale.service';
import { HiveHubAlertService } from './hivehub-alert.service';
import { HiveHubAlertScheduler } from './hivehub-alert.scheduler';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    MailModule,
    // HiveHub verifies the forwarded token with the same secret
    // (HIVEPAL_JWT_SECRET on the HiveHub side).
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [HiveScaleController],
  providers: [
    HiveScaleService,
    HiveHubAlertService,
    HiveHubAlertScheduler,
    PrismaService,
  ],
})
export class HiveScaleModule {}
