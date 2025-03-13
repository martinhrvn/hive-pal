import { PartialType } from '@nestjs/swagger';
import { CreateApiaryDto } from './create-apiary.dto';

export class UpdateApiaryDto extends PartialType(CreateApiaryDto) {}
