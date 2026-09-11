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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TreatmentProductsService } from './treatment-products.service';
import {
  createTreatmentProductSchema,
  updateTreatmentProductSchema,
  createActiveIngredientSchema,
  type CreateTreatmentProductDto,
  type UpdateTreatmentProductDto,
  type CreateActiveIngredientDto,
} from 'shared-schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interface/request-with-user.interface';
import { ZodValidation } from '../common';

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

@ApiTags('treatment-products')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TreatmentProductsController {
  constructor(private readonly service: TreatmentProductsService) {}

  @Get('treatment-products')
  @ApiOperation({ summary: 'List built-in and own custom treatment products' })
  findAll(@Req() req: RequestWithUser) {
    return this.service.findAll(req.user.id);
  }

  @Post('treatment-products')
  @ApiOperation({ summary: 'Create a custom treatment product' })
  @ZodValidation(createTreatmentProductSchema)
  create(
    @Body() dto: CreateTreatmentProductDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.create(req.user.id, dto);
  }

  @Put('treatment-products/:id')
  @ApiOperation({ summary: 'Update a custom treatment product' })
  @ZodValidation(updateTreatmentProductSchema)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTreatmentProductDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.update(req.user.id, id, dto);
  }

  @Delete('treatment-products/:id')
  @ApiOperation({ summary: 'Delete a custom treatment product' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.service.remove(req.user.id, id);
  }

  @Get('hives/:hiveId/treatment-summary')
  @ApiOperation({
    summary: 'Applied active-ingredient totals & withdrawal status for a hive',
  })
  getHiveSummary(
    @Param('hiveId') hiveId: string,
    @Req() req: RequestWithUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getHiveTreatmentSummary(
      req.user.id,
      hiveId,
      parseDate(from),
      parseDate(to),
    );
  }

  @Get('apiaries/:apiaryId/treatment-ingredient-totals')
  @ApiOperation({
    summary: 'Per-hive applied active-ingredient totals across an apiary',
  })
  getApiaryTotals(
    @Param('apiaryId') apiaryId: string,
    @Req() req: RequestWithUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getApiaryIngredientTotals(
      req.user.id,
      apiaryId,
      parseDate(from),
      parseDate(to),
    );
  }

  @Get('active-ingredients')
  @ApiOperation({ summary: 'List active ingredients (built-in + custom)' })
  listActiveIngredients() {
    return this.service.listActiveIngredients();
  }

  @Post('active-ingredients')
  @ApiOperation({ summary: 'Add a custom active ingredient' })
  @ZodValidation(createActiveIngredientSchema)
  createActiveIngredient(
    @Body() dto: CreateActiveIngredientDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.createActiveIngredient(req.user.id, dto);
  }
}
