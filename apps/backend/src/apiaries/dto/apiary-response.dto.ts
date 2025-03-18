// No class-validator imports needed for response DTOs
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ApiaryResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the apiary',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Name of the apiary',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Location of the apiary',
    required: false,
    nullable: true,
  })
  @Expose()
  location?: string;

  @ApiProperty({
    description: 'Latitude of the apiary',
    required: false,
    nullable: true,
  })
  @Expose()
  latitude?: number;

  @ApiProperty({
    description: 'Longitude of the apiary',
    required: false,
    nullable: true,
  })
  longitude?: number;
}
