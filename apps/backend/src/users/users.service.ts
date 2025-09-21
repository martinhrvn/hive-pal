import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserPreferences, UpdateUserInfo } from 'shared-schemas';

type PartialUser = Omit<User, 'password'>;

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

  async create(data: {
    email: string;
    password: string;
    name?: string;
    privacyPolicyConsent?: boolean;
    privacyConsentTimestamp?: Date;
    newsletterConsent?: boolean;
    newsletterConsentTimestamp?: Date | null;
  }) {
    return this.prismaService.user.create({ data });
  }

  async findAll(): Promise<PartialUser[]> {
    const users = await this.prismaService.user.findMany();

    // Exclude the password field from the response
    return users.map(({ password: _, ...userData }) => userData);
  }

  async resetPassword(
    userId: string,
    tempPassword: string,
  ): Promise<PartialUser> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update the user with the new password and set passwordChangeRequired to true
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordChangeRequired: true,
      },
    });

    // Exclude the password field from the response
    const { password: _pw, ...userData } = updatedUser;
    return userData;
  }

  async changePassword(
    userId: string,
    newPassword: string,
  ): Promise<PartialUser> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user with the new password and set passwordChangeRequired to false
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordChangeRequired: false,
      },
    });

    // Exclude the password field from the response
    const { password: _pw, ...userData } = updatedUser;
    return userData;
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
  ): Promise<PartialUser> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.email && { email: updateData.email }),
      },
    });

    // Exclude the password field from the response
    const { password: _pw, ...userData } = updatedUser;
    return userData;
  }
}
