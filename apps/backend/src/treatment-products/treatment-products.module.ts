import { Module } from '@nestjs/common';
import { TreatmentProductsController } from './treatment-products.controller';
import { TreatmentProductsService } from './treatment-products.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TreatmentProductsController],
  providers: [TreatmentProductsService, PrismaService],
  exports: [TreatmentProductsService],
})
export class TreatmentProductsModule {}
