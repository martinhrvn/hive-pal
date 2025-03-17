import { Injectable } from '@nestjs/common';
import { CreateApiaryDto } from './dto/create-apiary.dto';
import { UpdateApiaryDto } from './dto/update-apiary.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiaryResponseDto } from './dto/apiary-response.dto';
import { plainToInstance } from 'class-transformer';
import { Prisma } from '@prisma/client';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class ApiariesService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLoggerService,
  ) {
    this.logger.setContext('ApiariesService');
  }

  async create(
    createApiaryDto: CreateApiaryDto,
    userId: string,
  ): Promise<ApiaryResponseDto> {
    this.logger.log(`Creating apiary for user ${userId}`);
    this.logger.debug(`Apiary data: ${JSON.stringify(createApiaryDto)}`);

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

    this.logger.log(`Apiary created with ID: ${apiary.id}`);

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
    this.logger.log(`Fetching all apiaries for user ${userId}`);

    const apiaries = await this.prisma.apiary.findMany({
      where: {
        userId,
      },
    });

    this.logger.log(`Found ${apiaries.length} apiaries for user ${userId}`);
    return plainToInstance(ApiaryResponseDto, apiaries);
  }

  async findOne(apiaryId: string, userId: string) {
    this.logger.log(`Fetching apiary ${apiaryId} for user ${userId}`);

    const apiary = await this.prisma.apiary.findFirst({
      where: {
        id: apiaryId,
        userId,
      },
    });

    if (!apiary) {
      this.logger.warn(`Apiary ${apiaryId} not found for user ${userId}`);
    } else {
      this.logger.debug(`Found apiary: ${apiary.name}`);
    }

    return apiary;
  }

  async update(id: string, updateApiaryDto: UpdateApiaryDto, userId: string) {
    this.logger.log(`Updating apiary ${id} for user ${userId}`);
    this.logger.debug(`Update data: ${JSON.stringify(updateApiaryDto)}`);

    try {
      const updatedApiary = await this.prisma.apiary.update({
        where: { id, userId },
        data: updateApiaryDto,
      });

      this.logger.log(`Apiary ${id} updated successfully`);
      return updatedApiary;
    } catch (error) {
      this.logger.error(`Failed to update apiary ${id}`, error.stack);
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    this.logger.log(`Removing apiary ${id} for user ${userId}`);

    try {
      const deletedApiary = await this.prisma.apiary.delete({
        where: { id, userId },
      });

      this.logger.log(`Apiary ${id} removed successfully`);
      return deletedApiary;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Failed to remove apiary ${id}`, error.stack);
      } else {
        this.logger.error(
          `Failed to remove apiary ${id}`,
          JSON.stringify(error),
        );
      }

      throw error;
    }
  }
}
