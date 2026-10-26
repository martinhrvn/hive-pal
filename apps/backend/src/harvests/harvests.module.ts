import { Module } from '@nestjs/common';
import { HarvestsController } from './harvests.controller';
import { HarvestsService } from './harvests.service';
import { ActionsModule } from '../actions/actions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ActionsModule, UsersModule],
  controllers: [HarvestsController],
  providers: [HarvestsService],
  exports: [HarvestsService],
})
export class HarvestsModule {}
