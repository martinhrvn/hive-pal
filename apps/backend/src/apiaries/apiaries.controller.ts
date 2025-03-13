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

@UseGuards(JwtAuthGuard)
@Controller('apiaries')
export class ApiariesController {
  constructor(private readonly apiariesService: ApiariesService) {}

  @Post()
  @ApiCreatedResponse({ type: ApiaryResponseDto })
  @SerializeOptions({ type: ApiaryResponseDto })
  create(@Body() createApiaryDto: CreateApiaryDto): Promise<ApiaryResponseDto> {
    return this.apiariesService.create(createApiaryDto);
  }

  @Get()
  @ApiOkResponse({ type: ApiaryResponseDto, isArray: true })
  @SerializeOptions({ type: ApiaryResponseDto })
  findAll(@Req() req: RequestWithUser): Promise<ApiaryResponseDto[]> {
    return this.apiariesService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.apiariesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateApiaryDto: UpdateApiaryDto) {
    return this.apiariesService.update(+id, updateApiaryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.apiariesService.remove(+id);
  }
}
