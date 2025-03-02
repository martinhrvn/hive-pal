import { Module } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [InspectionsController],
  providers: [InspectionsService, PrismaService],
})
export class InspectionsModule {}
