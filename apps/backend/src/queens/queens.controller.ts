import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QueensService } from './queens.service';
import { CreateQueenDto } from './dto/create-queen.dto';
import { UpdateQueenDto } from './dto/update-queen.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { QueenResponseDto } from './dto/queen-response.dto';

@ApiTags('queens')
@Controller('queens')
export class QueensController {
  constructor(private readonly queensService: QueensService) {}

  @Post()
  @ApiCreatedResponse({ type: QueenResponseDto })
  create(@Body() createQueenDto: CreateQueenDto) {
    return this.queensService.create(createQueenDto);
  }

  @Get()
  @ApiOkResponse({ type: [QueenResponseDto] })
  findAll() {
    return this.queensService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: QueenResponseDto })
  findOne(@Param('id') id: string) {
    return this.queensService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: QueenResponseDto })
  update(@Param('id') id: string, @Body() updateQueenDto: UpdateQueenDto) {
    return this.queensService.update(id, updateQueenDto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: QueenResponseDto })
  remove(@Param('id') id: string) {
    return this.queensService.remove(id);
  }
}
