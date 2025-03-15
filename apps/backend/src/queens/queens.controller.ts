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

@ApiTags('queens')
@UseGuards(JwtAuthGuard, ApiaryContextGuard)
@Controller('queens')
export class QueensController {
  constructor(private readonly queensService: QueensService) {}

  @Post()
  @ApiCreatedResponse({ type: QueenResponseDto })
  create(
    @Body() createQueenDto: CreateQueenDto,
    @Req() req: RequestWithApiary
  ) {
    return this.queensService.create(createQueenDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get()
  @ApiOkResponse({ type: [QueenResponseDto] })
  findAll(@Req() req: RequestWithApiary) {
    return this.queensService.findAll({
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get(':id')
  @ApiOkResponse({ type: QueenResponseDto })
  findOne(
    @Param('id') id: string,
    @Req() req: RequestWithApiary
  ) {
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
    @Req() req: RequestWithApiary
  ) {
    return this.queensService.update(id, updateQueenDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Delete(':id')
  @ApiOkResponse({ type: QueenResponseDto })
  remove(
    @Param('id') id: string,
    @Req() req: RequestWithApiary
  ) {
    return this.queensService.remove(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
