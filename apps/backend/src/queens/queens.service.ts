import { Injectable } from '@nestjs/common';
import { CreateQueenDto } from './dto/create-queen.dto';
import { UpdateQueenDto } from './dto/update-queen.dto';

@Injectable()
export class QueensService {
  create(createQueenDto: CreateQueenDto) {
    return 'This action adds a new queen';
  }

  findAll() {
    return `This action returns all queens`;
  }

  findOne(id: number) {
    return `This action returns a #${id} queen`;
  }

  update(id: number, updateQueenDto: UpdateQueenDto) {
    return `This action updates a #${id} queen`;
  }

  remove(id: number) {
    return `This action removes a #${id} queen`;
  }
}
