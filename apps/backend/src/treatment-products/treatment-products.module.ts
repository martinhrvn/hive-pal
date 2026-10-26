import { Module } from '@nestjs/common';
import { TreatmentProductsController } from './treatment-products.controller';
import { TreatmentProductsService } from './treatment-products.service';

@Module({
  controllers: [TreatmentProductsController],
  providers: [TreatmentProductsService],
  exports: [TreatmentProductsService],
})
export class TreatmentProductsModule {}
