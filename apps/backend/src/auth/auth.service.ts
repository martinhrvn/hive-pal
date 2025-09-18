// auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User as PrismaUser } from '@prisma/client';
import { AuthResponse, User, SuccessResponse } from 'shared-schemas';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<
    PrismaUser,
    'password' | 'createdAt' | 'updatedAt' | 'preferences'
  > | null> {
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
        privacyPolicyConsent: true,
        privacyConsentTimestamp: null,
        newsletterConsent: false,
        newsletterConsentTimestamp: null,
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
    privacyPolicyConsent: boolean = false,
    newsletterConsent: boolean = false,
  ): Promise<AuthResponse> {
    // Validate GDPR consent
    if (!privacyPolicyConsent) {
      throw new UnauthorizedException('Privacy policy consent is required');
    }

    // Check if user exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const now = new Date();
    const newUser = await this.usersService.create({
      email,
      password: hashedPassword,
      name,
      privacyPolicyConsent,
      privacyConsentTimestamp: now,
      newsletterConsent,
      newsletterConsentTimestamp: newsletterConsent ? now : null,
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

  async forgotPassword(email: string): Promise<SuccessResponse> {
    // Check if user exists
    const user = await this.usersService.findByEmail(email);

    // Always return success for security (don't reveal if email exists)
    // but only send email if user exists
    if (user) {
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store token in database
      await this.prisma.passwordResetToken.create({
        data: {
          token,
          email,
          userId: user.id,
          expiresAt,
        },
      });

      // Send email
      await this.mailService.sendPasswordResetEmail(email, token);
    }

    return {
      message:
        'If an account with this email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<SuccessResponse> {
    // Find the token
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    // Validate token
    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // Find user by email (in case user was deleted after token creation)
    const user = await this.usersService.findByEmail(resetToken.email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordChangeRequired: false,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return {
      message: 'Password has been reset successfully',
    };
  }
}
