import { Module } from '@nestjs/common';
import { ActionsService } from './actions.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActionsController } from './actions.controller';

@Module({
  controllers: [ActionsController],
  providers: [PrismaService, ActionsService],
  exports: [ActionsService],
})
export class ActionsModule {}
