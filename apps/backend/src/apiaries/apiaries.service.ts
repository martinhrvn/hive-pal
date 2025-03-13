import { Injectable } from '@nestjs/common';
import { CreateApiaryDto } from './dto/create-apiary.dto';
import { UpdateApiaryDto } from './dto/update-apiary.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiaryResponseDto } from './dto/apiary-response.dto';
import { plainToInstance } from 'class-transformer';
import { Prisma } from '@prisma/client';

@Injectable()
export class ApiariesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createApiaryDto: CreateApiaryDto,
    userId: string,
  ): Promise<ApiaryResponseDto> {
    const apiaryData: Prisma.ApiaryUncheckedCreateInput = {
      name: createApiaryDto.name,
      location: createApiaryDto.location,
      latitude: createApiaryDto.latitude,
      longitude: createApiaryDto.longitude,
      userId,
    };
    const apiary = await this.prisma.apiary.create({
      data: apiaryData,
    });

    return plainToInstance(ApiaryResponseDto, {
      id: apiary.id,
      name: apiary.name,
      location: apiary.location,
      latitude: apiary.latitude,
      longitude: apiary.longitude,
      notes: apiary.notes,
    });
  }

  async findAll(userId: string): Promise<ApiaryResponseDto[]> {
    return plainToInstance(
      ApiaryResponseDto,
      await this.prisma.apiary.findMany({
        where: {
          userId,
        },
      }),
    );
  }

  findOne(id: number) {
    return `This action returns a #${id} apiary`;
  }

  update(id: number, updateApiaryDto: UpdateApiaryDto) {
    return `This action updates a #${id} apiary`;
  }

  remove(id: number) {
    return `This action removes a #${id} apiary`;
  }
}
