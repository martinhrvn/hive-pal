import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserPreferences, UpdateUserInfo } from 'shared-schemas';

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<User[]> {
    return this.prismaService.user.findMany();
  }

  /**
   * Returns a lightweight list of all users (id, email, name).
   * Used by the swarm alert scheduler to iterate over users that
   * may have swarm alerts configured.
   */
  async getAllUsers(): Promise<
    Array<{ id: string; email: string; name: string | null }>
  > {
    return this.prismaService.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user || !user.preferences) {
      return null;
    }

    return user.preferences as UserPreferences;
  }

  async updateUserPreferences(
    userId: string,
    preferences: UserPreferences,
  ): Promise<UserPreferences> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: { preferences: preferences as object },
    });

    return updatedUser.preferences as UserPreferences;
  }

  async updateUserInfo(
    userId: string,
    updateData: UpdateUserInfo,
  ): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prismaService.user.update({
      where: { id: userId },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.email && { email: updateData.email }),
      },
    });
  }
}
