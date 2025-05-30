// auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User as PrismaUser } from '@prisma/client';
import { AuthResponse, User } from 'shared-schemas';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<PrismaUser, 'password' | 'createdAt' | 'updatedAt'> | null> {
    if (
      email === process.env.ADMIN_EMAIL &&
      (await bcrypt.compare(password, process.env.ADMIN_PASSWORD || ''))
    ) {
      return {
        id: 'admin',
        email: 'admin@hivepal.com',
        name: 'Admin',
        role: 'ADMIN',
        passwordChangeRequired: false,
      };
    }

    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: User): AuthResponse {
    // If validation failed
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      name: user.name,
      passwordChangeRequired: user.passwordChangeRequired || false,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        passwordChangeRequired: user.passwordChangeRequired || false,
      },
    };
  }

  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await this.usersService.create({
      email,
      password: hashedPassword,
      name,
    });

    // Remove password from response
    const { password: _, ...user } = newUser;
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      name: user.name,
      passwordChangeRequired: user.passwordChangeRequired || false,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? '',
        role: user.role,
        passwordChangeRequired: user.passwordChangeRequired || false,
      },
    };
  }

  async getProfile(userId: string): Promise<User> {
    // Special case for admin user
    if (userId === 'admin') {
      return {
        id: 'admin',
        email: 'admin@hivepal.com',
        name: 'Admin',
        role: 'ADMIN',
        passwordChangeRequired: false,
      };
    }

    // For regular users, fetch from database
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove password from response
    const { password: _, ...userData } = user;

    return userData;
  }
}
