import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueensService } from './queens.service';
import { CreateQueenDto } from './dto/create-queen.dto';
import { UpdateQueenDto } from './dto/update-queen.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { QueenResponseDto } from './dto/queen-response.dto';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { RequestWithApiary } from '../interface/request-with.apiary';
import { CustomLoggerService } from '../logger/logger.service';

@ApiTags('queens')
@UseGuards(JwtAuthGuard, ApiaryContextGuard)
@Controller('queens')
export class QueensController {
  constructor(
    private readonly queensService: QueensService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('QueensController');
  }

  @Post()
  @ApiCreatedResponse({ type: QueenResponseDto })
  create(
    @Body() createQueenDto: CreateQueenDto,
    @Req() req: RequestWithApiary,
  ) {
    this.logger.log(
      `Creating queen for hive ${createQueenDto.hiveId} in apiary ${req.apiaryId}`,
    );
    return this.queensService.create(createQueenDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get()
  @ApiOkResponse({ type: [QueenResponseDto] })
  findAll(@Req() req: RequestWithApiary) {
    this.logger.log(`Finding all queens in apiary ${req.apiaryId}`);
    return this.queensService.findAll({
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get(':id')
  @ApiOkResponse({ type: QueenResponseDto })
  findOne(@Param('id') id: string, @Req() req: RequestWithApiary) {
    this.logger.log(`Finding queen with ID ${id} in apiary ${req.apiaryId}`);
    return this.queensService.findOne(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Patch(':id')
  @ApiOkResponse({ type: QueenResponseDto })
  update(
    @Param('id') id: string,
    @Body() updateQueenDto: UpdateQueenDto,
    @Req() req: RequestWithApiary,
  ) {
    this.logger.log(`Updating queen with ID ${id} in apiary ${req.apiaryId}`);
    this.logger.debug(`Update data: ${JSON.stringify(updateQueenDto)}`);
    return this.queensService.update(id, updateQueenDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Delete(':id')
  @ApiOkResponse({ type: QueenResponseDto })
  remove(@Param('id') id: string, @Req() req: RequestWithApiary) {
    this.logger.log(`Removing queen with ID ${id} from apiary ${req.apiaryId}`);
    return this.queensService.remove(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
