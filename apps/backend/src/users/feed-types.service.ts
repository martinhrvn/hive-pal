import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserFeedType,
  UpdateUserFeedType,
  UserFeedTypeResponse,
  FeedForm,
} from 'shared-schemas';

/**
 * Per-user custom feed types (e.g. a specific commercial invert syrup) with
 * density and sugar content, complementing the built-in registry in
 * shared-schemas. Feed types are user-scoped: they are personal reference
 * data, not apiary data.
 */
@Injectable()
export class FeedTypesService {
  constructor(private prismaService: PrismaService) {}

  async getFeedTypes(userId: string): Promise<UserFeedTypeResponse[]> {
    const rows = await this.prismaService.userFeedType.findMany({
      where: { userId },
      orderBy: { label: 'asc' },
    });
    return rows.map(row => this.toDto(row));
  }

  async createFeedType(
    userId: string,
    data: CreateUserFeedType,
  ): Promise<UserFeedTypeResponse> {
    const row = await this.prismaService.userFeedType.create({
      data: {
        userId,
        label: data.label,
        form: data.form,
        density: data.density,
        sugarContent: data.sugarContent,
      },
    });
    return this.toDto(row);
  }

  async updateFeedType(
    userId: string,
    id: string,
    data: UpdateUserFeedType,
  ): Promise<UserFeedTypeResponse> {
    // Scope the lookup by userId so users can only touch their own types.
    const existing = await this.prismaService.userFeedType.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException(`Feed type ${id} not found`);
    }
    const row = await this.prismaService.userFeedType.update({
      where: { id },
      data: {
        label: data.label,
        form: data.form,
        density: data.density,
        sugarContent: data.sugarContent,
        archived: data.archived,
      },
    });
    return this.toDto(row);
  }

  async deleteFeedType(userId: string, id: string): Promise<void> {
    const existing = await this.prismaService.userFeedType.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException(`Feed type ${id} not found`);
    }
    // Hard delete; feeding records keep their own denormalized label +
    // density/sugarContent snapshot, so history is unaffected.
    await this.prismaService.userFeedType.delete({ where: { id } });
  }

  private toDto(row: {
    id: string;
    label: string;
    form: string;
    density: number | null;
    sugarContent: number;
    archived: boolean;
  }): UserFeedTypeResponse {
    return {
      id: row.id,
      label: row.label,
      form: row.form as FeedForm,
      density: row.density,
      sugarContent: row.sugarContent,
      archived: row.archived,
    };
  }
}
