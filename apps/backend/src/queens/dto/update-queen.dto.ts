import { PartialType } from '@nestjs/swagger';
import { CreateQueenDto } from './create-queen.dto';

export class UpdateQueenDto extends PartialType(CreateQueenDto) {}
