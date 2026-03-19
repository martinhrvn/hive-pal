import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CustomLoggerService } from '../logger/logger.service';
import { ApiaryMember, InviteMember, UpdateMemberRole } from 'shared-schemas';

@Injectable()
export class ApiaryMembersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private logger: CustomLoggerService,
  ) {
    this.logger.setContext('ApiaryMembersService');
  }

  async findAll(apiaryId: string): Promise<ApiaryMember[]> {
    const members = await this.prisma.apiaryMember.findMany({
      where: { apiaryId },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: [{ role: 'asc' }, { invitedAt: 'asc' }],
    });

    return members.map((m) => ({
      id: m.id,
      apiaryId: m.apiaryId,
      userId: m.userId,
      role: m.role,
      invitedById: m.invitedById,
      invitedAt: m.invitedAt,
      acceptedAt: m.acceptedAt,
      user: { id: m.user.id, email: m.user.email, name: m.user.name },
    }));
  }

  async invite(
    apiaryId: string,
    invitedById: string,
    dto: InviteMember,
  ): Promise<ApiaryMember> {
    this.logger.log(
      `Inviting ${dto.email} to apiary ${apiaryId} as ${dto.role}`,
    );

    const apiary = await this.prisma.apiary.findUnique({
      where: { id: apiaryId },
      select: { name: true },
    });
    if (!apiary) throw new NotFoundException('Apiary not found');

    const invitedUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, name: true },
    });
    if (!invitedUser) {
      throw new NotFoundException(
        `No account found for ${dto.email}. They must register first.`,
      );
    }

    if (invitedUser.id === invitedById) {
      throw new ConflictException('You cannot invite yourself');
    }

    const existing = await this.prisma.apiaryMember.findUnique({
      where: { apiaryId_userId: { apiaryId, userId: invitedUser.id } },
    });
    if (existing) {
      throw new ConflictException(
        existing.acceptedAt
          ? 'This user is already a member'
          : 'An invitation is already pending for this user',
      );
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');

    const member = await this.prisma.apiaryMember.create({
      data: {
        apiaryId,
        userId: invitedUser.id,
        role: dto.role,
        invitedById,
        inviteToken,
      },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    const inviter = await this.prisma.user.findUnique({
      where: { id: invitedById },
      select: { name: true, email: true },
    });

    await this.mailService.sendApiaryInviteEmail(
      invitedUser.email,
      inviteToken,
      apiary.name,
      inviter?.name ?? inviter?.email ?? 'A beekeeper',
    );

    return {
      id: member.id,
      apiaryId: member.apiaryId,
      userId: member.userId,
      role: member.role,
      invitedById: member.invitedById,
      invitedAt: member.invitedAt,
      acceptedAt: member.acceptedAt,
      user: {
        id: member.user.id,
        email: member.user.email,
        name: member.user.name,
      },
    };
  }

  async acceptInvite(token: string): Promise<{ apiaryId: string }> {
    const member = await this.prisma.apiaryMember.findUnique({
      where: { inviteToken: token },
    });

    if (!member) throw new NotFoundException('Invalid or expired invitation');
    if (member.acceptedAt) throw new ConflictException('Invitation already accepted');

    const updated = await this.prisma.apiaryMember.update({
      where: { id: member.id },
      data: { acceptedAt: new Date(), inviteToken: null },
    });

    this.logger.log(
      `User ${member.userId} accepted invite to apiary ${member.apiaryId}`,
    );

    return { apiaryId: updated.apiaryId };
  }

  async updateRole(
    apiaryId: string,
    targetUserId: string,
    requestingUserId: string,
    dto: UpdateMemberRole,
  ): Promise<ApiaryMember> {
    const target = await this.prisma.apiaryMember.findUnique({
      where: { apiaryId_userId: { apiaryId, userId: targetUserId } },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'OWNER') {
      throw new ForbiddenException('Cannot change the role of the apiary owner');
    }

    const updated = await this.prisma.apiaryMember.update({
      where: { id: target.id },
      data: { role: dto.role },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    return {
      id: updated.id,
      apiaryId: updated.apiaryId,
      userId: updated.userId,
      role: updated.role,
      invitedById: updated.invitedById,
      invitedAt: updated.invitedAt,
      acceptedAt: updated.acceptedAt,
      user: {
        id: updated.user.id,
        email: updated.user.email,
        name: updated.user.name,
      },
    };
  }

  async removeMember(
    apiaryId: string,
    targetUserId: string,
    requestingUserId: string,
  ): Promise<void> {
    const target = await this.prisma.apiaryMember.findUnique({
      where: { apiaryId_userId: { apiaryId, userId: targetUserId } },
    });

    if (!target) throw new NotFoundException('Member not found');

    // OWNER cannot be removed via this endpoint (prevents accidental lockout)
    if (target.role === 'OWNER' && targetUserId !== requestingUserId) {
      throw new ForbiddenException('Cannot remove the apiary owner');
    }

    await this.prisma.apiaryMember.delete({ where: { id: target.id } });

    this.logger.log(
      `User ${targetUserId} removed from apiary ${apiaryId} by ${requestingUserId}`,
    );
  }
}
