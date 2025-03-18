import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class HiveFilterDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
  })
  includeInactive: boolean = false;
}
