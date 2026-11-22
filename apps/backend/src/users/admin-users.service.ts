import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Prisma } from '@/prisma/client';
import {
  AdminCreateUser,
  AdminUser,
  AdminUserCapabilities,
  AdminUserListQuery,
  AdminUserListResponse,
} from 'shared-schemas';
import { auth } from '../auth/better-auth';
import { isRegistrationDisabled } from '../auth/registration-config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CustomLoggerService } from '../logger/logger.service';
import { UsersService } from './users.service';
import { UsersStatsService } from './users-stats.service';

/** How long an emailed account-setup link stays valid. */
export const SETUP_LINK_TTL_HOURS = 72;

const adminUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  passwordChangeRequired: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  banned: true,
  banReason: true,
  banExpires: true,
} satisfies Prisma.UserSelect;

type AdminUserRow = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>;

const toAdminUser = (row: AdminUserRow): AdminUser => ({
  ...row,
  banned: row.banned ?? false,
});

const EMPTY_STATS = {
  apiariesCount: 0,
  hivesCount: 0,
  inspectionsCount: 0,
  lastActivityDate: null,
};

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly usersStatsService: UsersStatsService,
    private readonly mail: MailService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('AdminUsersService');
  }

  getCapabilities(): AdminUserCapabilities {
    return {
      mailEnabled: this.mail.getMailStatus().enabled,
      registrationEnabled: !isRegistrationDisabled(),
    };
  }

  async list(query: AdminUserListQuery): Promise<AdminUserListResponse> {
    const where = this.buildWhere(query);
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: adminUserSelect,
        orderBy: [this.buildOrderBy(query), { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    const stats = await this.usersStatsService.getUsersSummaryStats(
      rows.map((row) => row.id),
    );

    return {
      items: rows.map((row) => ({
        ...toAdminUser(row),
        stats: stats.get(row.id) ?? EMPTY_STATS,
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findOne(id: string): Promise<AdminUser> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      select: adminUserSelect,
    });
    if (!row) throw new NotFoundException('User not found');
    return toAdminUser(row);
  }

  async create(input: AdminCreateUser): Promise<AdminUser> {
    const email = input.email.trim().toLowerCase();
    const sendSetupLink = input.credential === 'setupLink';
    if (sendSetupLink && !this.mail.getMailStatus().enabled) {
      throw new BadRequestException(
        'Email is not configured, so a setup link cannot be sent. Set a temporary password instead.',
      );
    }
    if (await this.usersService.findByEmail(email)) {
      throw new ConflictException('A user with this email already exists');
    }

    // Without request headers createUser runs as a trusted server call; the
    // admin check already happened in the controller's guards. It bypasses
    // DISABLE_REGISTRATION and still runs the user-create hooks (default
    // apiary).
    const { user } = await auth.api.createUser({
      body: {
        email,
        name: input.name,
        // A setup-link user never learns this password; they choose their own.
        password: sendSetupLink
          ? randomBytes(32).toString('base64url')
          : input.password,
        data: {
          // Through `data`: the typed `role` field only knows Better Auth's
          // default lowercase roles, while Hive Pal stores USER/ADMIN.
          role: input.role,
          emailVerified: true,
          passwordChangeRequired: !sendSetupLink,
        },
      },
    });

    if (sendSetupLink && !(await this.sendSetupLink(user.id, email))) {
      // Don't leave an account behind that nobody can sign in to.
      await this.usersService.deleteAccount(user.id);
      throw new ServiceUnavailableException(
        'The setup email could not be sent. The user was not created.',
      );
    }

    this.logger.log({
      message: 'Admin created user',
      userId: user.id,
      role: input.role,
      credential: input.credential,
    });
    return this.findOne(user.id);
  }

  async delete(id: string, actorId: string): Promise<void> {
    if (id === actorId) {
      throw new BadRequestException('You cannot delete your own account here');
    }
    await this.findOne(id);
    await this.usersService.deleteAccount(id);
    this.logger.log({ message: 'Admin deleted user', userId: id, actorId });
  }

  private buildOrderBy(
    query: AdminUserListQuery,
  ): Prisma.UserOrderByWithRelationInput {
    // Users who never signed in sort after everyone else either way.
    if (query.sort === 'lastLoginAt') {
      return { lastLoginAt: { sort: query.order, nulls: 'last' } };
    }
    return { [query.sort]: query.order };
  }

  private buildWhere(query: AdminUserListQuery): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.role) where.role = query.role;
    if (query.status === 'banned') where.banned = true;
    if (query.status === 'active') where.banned = { not: true };
    return where;
  }

  /**
   * Emails a link to the reset-password page. The token uses Better Auth's
   * own reset-password format (`reset-password:<token>` verification value,
   * see better-auth `api/routes/password.mjs`), so the stock reset flow
   * consumes it; only the expiry is longer than a normal reset link.
   */
  private async sendSetupLink(userId: string, email: string): Promise<boolean> {
    const ctx = await auth.$context;
    const token = randomBytes(24).toString('base64url');
    await ctx.internalAdapter.createVerificationValue({
      identifier: `reset-password:${token}`,
      value: userId,
      expiresAt: new Date(Date.now() + SETUP_LINK_TTL_HOURS * 60 * 60 * 1000),
    });
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const callbackURL = encodeURIComponent(
      `${frontendUrl}/reset-password?setup=1`,
    );
    const url = `${ctx.baseURL}/reset-password/${token}?callbackURL=${callbackURL}`;
    return this.mail.sendAccountSetupEmail(email, url, SETUP_LINK_TTL_HOURS);
  }
}
