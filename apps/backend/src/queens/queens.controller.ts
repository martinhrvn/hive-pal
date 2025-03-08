import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QueensService } from './queens.service';
import { CreateQueenDto } from './dto/create-queen.dto';
import { UpdateQueenDto } from './dto/update-queen.dto';

@Controller('queens')
export class QueensController {
  constructor(private readonly queensService: QueensService) {}

  @Post()
  create(@Body() createQueenDto: CreateQueenDto) {
    return this.queensService.create(createQueenDto);
  }

  @Get()
  findAll() {
    return this.queensService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.queensService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQueenDto: UpdateQueenDto) {
    return this.queensService.update(+id, updateQueenDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.queensService.remove(+id);
  }
}
