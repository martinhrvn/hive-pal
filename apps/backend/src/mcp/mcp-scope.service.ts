import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { apiaryAccessWhere } from '../common/apiary-scope';
import { ApiaryScopeFilter } from '../interface/request-with.apiary';

/**
 * Builds the `ApiaryScopeFilter` the feature services expect, from an optional
 * `apiaryId` tool argument instead of the `x-apiary-id` header.
 */
@Injectable()
export class McpScopeService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(userId: string, apiaryId?: string): Promise<ApiaryScopeFilter> {
    if (!apiaryId) return { userId, allApiaries: true };
    const apiary = await this.prisma.apiary.findFirst({
      where: { id: apiaryId, ...apiaryAccessWhere(userId) },
      select: { id: true },
    });
    if (!apiary) {
      throw new NotFoundException(`Apiary with ID ${apiaryId} not found`);
    }
    return { userId, apiaryId };
  }
}
