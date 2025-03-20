import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

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

  async create(data: { email: string; password: string; name?: string }) {
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
}
