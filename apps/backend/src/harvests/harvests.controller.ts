import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HarvestsService } from './harvests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';
import {
  CreateHarvest,
  UpdateHarvest,
  SetHarvestWeight,
  HarvestFilter,
  createHarvestSchema,
  updateHarvestSchema,
  setHarvestWeightSchema,
  harvestFilterSchema,
} from 'shared-schemas';
import { RequestWithUser } from '../auth/interface/request-with-user.interface';
import { RequestWithApiary } from '../interface/request-with.apiary';

@Controller('harvests')
@UseGuards(JwtAuthGuard)
export class HarvestsController {
  constructor(private readonly harvestsService: HarvestsService) {}

  @Post()
  @UseGuards(ApiaryContextGuard)
  @ZodValidation(createHarvestSchema)
  async create(
    @Request() req: RequestWithApiary,
    @Body() createHarvestDto: CreateHarvest,
  ) {
    return this.harvestsService.create(
      req.apiaryId,
      req.user.id,
      createHarvestDto,
    );
  }

  @Get()
  @ZodValidation(harvestFilterSchema)
  async findAll(
    @Request() req: RequestWithUser,
    @Query() filter: HarvestFilter,
  ) {
    return this.harvestsService.findAll(req.user.id, filter);
  }

  @Get(':id')
  async findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.harvestsService.findOne(id, req.user.id);
  }

  @Put(':id')
  @ZodValidation(updateHarvestSchema)
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateHarvestDto: UpdateHarvest,
  ) {
    return this.harvestsService.update(id, req.user.id, updateHarvestDto);
  }

  @Put(':id/weight')
  @ZodValidation(setHarvestWeightSchema)
  async setWeight(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() setWeightDto: SetHarvestWeight,
  ) {
    return this.harvestsService.setWeight(id, req.user.id, setWeightDto);
  }

  @Post(':id/finalize')
  async finalize(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.harvestsService.finalize(id, req.user.id);
  }

  @Post(':id/reopen')
  async reopen(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.harvestsService.reopen(id, req.user.id);
  }

  @Delete(':id')
  async delete(@Request() req: RequestWithUser, @Param('id') id: string) {
    await this.harvestsService.delete(id, req.user.id);
    return { message: 'Harvest deleted successfully' };
  }
}
