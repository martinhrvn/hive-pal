import { PartialType } from '@nestjs/mapped-types';
import { CreateHiveDto } from './create-hive.dto';

export class UpdateHiveDto extends PartialType(CreateHiveDto) {}
