import { Module } from '@nestjs/common';
import { ActionsService } from './actions.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [PrismaService, ActionsService],
})
export class ActionsModule {}
