import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  SerializeOptions,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiariesService } from './apiaries.service';
import { CreateApiaryDto } from './dto/create-apiary.dto';
import { UpdateApiaryDto } from './dto/update-apiary.dto';
import { ApiaryResponseDto } from './dto/apiary-response.dto';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interface/request-with-user.interface';
import { CustomLoggerService } from '../logger/logger.service';

@UseGuards(JwtAuthGuard)
@Controller('apiaries')
export class ApiariesController {
  constructor(
    private readonly apiariesService: ApiariesService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('ApiariesController');
  }

  @Post()
  @ApiCreatedResponse({ type: ApiaryResponseDto })
  @SerializeOptions({ type: ApiaryResponseDto })
  create(
    @Body() createApiaryDto: CreateApiaryDto,
    @Req() req: RequestWithUser,
  ): Promise<ApiaryResponseDto> {
    this.logger.log(
      `Creating apiary with name ${createApiaryDto.name} for user ${req.user.id}`,
    );
    return this.apiariesService.create(createApiaryDto, req.user.id);
  }

  @Get()
  @ApiOkResponse({ type: ApiaryResponseDto, isArray: true })
  @SerializeOptions({ type: ApiaryResponseDto })
  findAll(@Req() req: RequestWithUser): Promise<ApiaryResponseDto[]> {
    this.logger.log(`Getting all apiaries for user ${req.user.id}`);
    return this.apiariesService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOkResponse({ type: ApiaryResponseDto })
  @SerializeOptions({ type: ApiaryResponseDto })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    this.logger.log(`Getting apiary with ID ${id} for user ${req.user.id}`);
    return this.apiariesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateApiaryDto: UpdateApiaryDto,
    @Req() req: RequestWithUser,
  ) {
    this.logger.log(`Updating apiary with ID ${id} for user ${req.user.id}`);
    return this.apiariesService.update(id, updateApiaryDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    this.logger.log(`Deleting apiary with ID ${id} for user ${req.user.id}`);
    return this.apiariesService.remove(id, req.user.id);
  }
}
