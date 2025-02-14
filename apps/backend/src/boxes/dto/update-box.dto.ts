import { PartialType } from '@nestjs/swagger';
import { CreateBoxDto } from './create-box.dto';

export class UpdateBoxDto extends PartialType(CreateBoxDto) {}
