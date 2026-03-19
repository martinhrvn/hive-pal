import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CustomLoggerService } from '../logger/logger.service';

export interface ApiaryOption {
  id: string;
  name: string;
}

export interface JoinRequestInfo {
  id: string;
  apiaryName: string;
  requesterName: string;
  requesterEmail: string;
  status: string;
}

@Injectable()
export class ApiaryJoinRequestsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private logger: CustomLoggerService,
  ) {
    this.logger.setContext('ApiaryJoinRequestsService');
  }

  /** Look up apiaries owned by a given email address (for the requester to pick from) */
  async lookupApiariesByOwnerEmail(ownerEmail: string): Promise<ApiaryOption[]> {
    const owner = await this.prisma.user.findUnique({
      where: { email: ownerEmail },
      select: { id: true },
    });

    if (!owner) {
      throw new NotFoundException('No user found with that email address');
    }

    const ownerships = await this.prisma.apiaryMember.findMany({
      where: { userId: owner.id, role: 'OWNER', acceptedAt: { not: null } },
      include: { apiary: { select: { id: true, name: true } } },
    });

    if (ownerships.length === 0) {
      throw new NotFoundException('That user does not own any apiaries');
    }

    return ownerships.map((m) => ({ id: m.apiary.id, name: m.apiary.name }));
  }

  /** Create a join request — requester submits owner email + chosen apiaryId */
  async createJoinRequest(requesterId: string, apiaryId: string): Promise<void> {
    // Make sure the apiary exists and get the owner
    const apiary = await this.prisma.apiary.findUnique({
      where: { id: apiaryId },
      select: { id: true, name: true },
    });
    if (!apiary) throw new NotFoundException('Apiary not found');

    const ownerMembership = await this.prisma.apiaryMember.findFirst({
      where: { apiaryId, role: 'OWNER', acceptedAt: { not: null } },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (!ownerMembership) {
      throw new NotFoundException('Could not find the owner of this apiary');
    }

    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { id: true, email: true, name: true },
    });
    if (!requester) throw new NotFoundException('Requester not found');

    if (requester.id === ownerMembership.user.id) {
      throw new ConflictException('You already own this apiary');
    }

    // Check if already a member
    const existingMember = await this.prisma.apiaryMember.findUnique({
      where: { apiaryId_userId: { apiaryId, userId: requesterId } },
    });
    if (existingMember) {
      throw new ConflictException(
        existingMember.acceptedAt
          ? 'You are already a member of this apiary'
          : 'You already have a pending invitation to this apiary',
      );
    }

    // Check for existing pending join request
    const existingRequest = await this.prisma.apiaryJoinRequest.findFirst({
      where: { requesterId, apiaryId, status: 'PENDING' },
    });
    if (existingRequest) {
      throw new ConflictException('You already have a pending join request for this apiary');
    }

    const approveToken = crypto.randomBytes(32).toString('hex');
    const denyToken = crypto.randomBytes(32).toString('hex');

    await this.prisma.apiaryJoinRequest.create({
      data: {
        requesterId,
        apiaryId,
        ownerEmail: ownerMembership.user.email,
        approveToken,
        denyToken,
      },
    });

    this.logger.log(
      `Join request created: ${requester.email} → apiary ${apiaryId} (owner: ${ownerMembership.user.email})`,
    );

    await this.mailService.sendJoinRequestOwnerEmail(
      ownerMembership.user.email,
      requester.name ?? requester.email,
      requester.email,
      apiary.name,
      approveToken,
      denyToken,
    );
  }

  /** Retrieve join request info by approve token (for the approval page) */
  async getJoinRequestByApproveToken(token: string): Promise<JoinRequestInfo> {
    const request = await this.prisma.apiaryJoinRequest.findUnique({
      where: { approveToken: token },
      include: {
        requester: { select: { name: true, email: true } },
        apiary: { select: { name: true } },
      },
    });

    if (!request) throw new NotFoundException('Invalid or expired token');
    if (request.status !== 'PENDING') {
      throw new ConflictException(`This request has already been ${request.status.toLowerCase()}`);
    }

    return {
      id: request.id,
      apiaryName: request.apiary.name,
      requesterName: request.requester.name ?? request.requester.email,
      requesterEmail: request.requester.email,
      status: request.status,
    };
  }

  /** Approve a join request — owner picks a role */
  async approveJoinRequest(token: string, role: string): Promise<void> {
    const validRoles = ['EDITOR', 'VIEWER'];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    const request = await this.prisma.apiaryJoinRequest.findUnique({
      where: { approveToken: token },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        apiary: { select: { id: true, name: true } },
      },
    });

    if (!request) throw new NotFoundException('Invalid or expired token');
    if (request.status !== 'PENDING') {
      throw new ConflictException(`This request has already been ${request.status.toLowerCase()}`);
    }

    // Find the owner to use as invitedById
    const ownerMembership = await this.prisma.apiaryMember.findFirst({
      where: { apiaryId: request.apiaryId, role: 'OWNER', acceptedAt: { not: null } },
      select: { userId: true },
    });

    // Create the ApiaryMember record (already accepted)
    await this.prisma.apiaryMember.create({
      data: {
        apiaryId: request.apiaryId,
        userId: request.requesterId,
        role: role as any,
        invitedById: ownerMembership?.userId ?? request.requesterId,
        acceptedAt: new Date(),
      },
    });

    await this.prisma.apiaryJoinRequest.update({
      where: { id: request.id },
      data: { status: 'APPROVED' },
    });

    this.logger.log(
      `Join request approved: ${request.requester.email} → apiary ${request.apiaryId} as ${role}`,
    );

    await this.mailService.sendJoinRequestResultEmail(
      request.requester.email,
      request.requester.name ?? request.requester.email,
      request.apiary.name,
      true,
    );
  }

  /** Deny a join request */
  async denyJoinRequest(token: string): Promise<void> {
    const request = await this.prisma.apiaryJoinRequest.findUnique({
      where: { denyToken: token },
      include: {
        requester: { select: { name: true, email: true } },
        apiary: { select: { name: true } },
      },
    });

    if (!request) throw new NotFoundException('Invalid or expired token');
    if (request.status !== 'PENDING') {
      throw new ConflictException(`This request has already been ${request.status.toLowerCase()}`);
    }

    await this.prisma.apiaryJoinRequest.update({
      where: { id: request.id },
      data: { status: 'DENIED' },
    });

    this.logger.log(
      `Join request denied: ${request.requester.email} → apiary ${request.apiaryId}`,
    );

    await this.mailService.sendJoinRequestResultEmail(
      request.requester.email,
      request.requester.name ?? request.requester.email,
      request.apiary.name,
      false,
    );
  }
}
