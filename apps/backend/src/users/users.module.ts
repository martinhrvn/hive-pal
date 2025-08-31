import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { EquipmentService } from './equipment.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [forwardRef(() => AuthModule), LoggerModule],
  controllers: [UsersController],
  providers: [UsersService, EquipmentService, PrismaService],
  exports: [UsersService, EquipmentService],
})
export class UsersModule {}
