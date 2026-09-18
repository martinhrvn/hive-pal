import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { ApiaryRole } from '@/prisma/client';
import { ALLOW_ALL_APIARIES_KEY } from './allow-all-apiaries.decorator';

/**
 * Reserved `x-apiary-id` value that selects the cross-apiary "view all" mode.
 * In this mode no single apiary is chosen; read queries span every apiary the
 * user has access to. Only safe (GET) requests may use it.
 */
export const ALL_APIARIES = 'all';

@Injectable()
export class ApiaryContextGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: {
      method: string;
      headers: Record<string, string>;
      query: Record<string, string>;
      apiaryId?: string;
      apiaryRole?: ApiaryRole;
      allApiaries?: boolean;
      user?: { id: string };
    } = context.switchToHttp().getRequest();

    const apiaryId = request.headers['x-apiary-id'] || request.query.apiaryId;

    if (!apiaryId) {
      throw new BadRequestException(
        'Apiary ID is required (x-apiary-id header or apiaryId query parameter)',
      );
    }

    // If user is not authenticated, we can't proceed
    if (!request.user?.id) {
      throw new ForbiddenException('User is not authenticated');
    }

    // "all" selects the cross-apiary read mode. It scopes queries to every
    // apiary the user has access to and is only allowed on GET handlers that
    // explicitly opt in via @AllowAllApiaries — otherwise a service that
    // filters by a single apiaryId would run an unscoped query.
    if (apiaryId === ALL_APIARIES) {
      const allowAll = this.reflector.getAllAndOverride<boolean>(
        ALLOW_ALL_APIARIES_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (!allowAll) {
        throw new BadRequestException(
          'This endpoint does not support the "all apiaries" view; ' +
            'select a specific apiary.',
        );
      }
      if (request.method.toUpperCase() !== 'GET') {
        throw new BadRequestException(
          'A specific apiary is required for write operations ' +
            '(x-apiary-id must not be "all")',
        );
      }
      request.allApiaries = true;
      request.apiaryId = undefined;
      return true;
    }

    // Find the apiary and check if user is owner or active member
    const apiary = await this.prisma.apiary.findFirst({
      where: {
        id: apiaryId,
        OR: [
          { userId: request.user.id },
          {
            members: {
              some: { userId: request.user.id, status: 'ACTIVE' },
            },
          },
        ],
      },
      include: {
        members: {
          where: { userId: request.user.id, status: 'ACTIVE' },
          select: { role: true },
        },
      },
    });

    if (!apiary) {
      throw new NotFoundException(
        'Apiary not found or does not belong to the user',
      );
    }

    // Determine the user's role for this apiary
    const role: ApiaryRole | undefined =
      apiary.userId === request.user.id ? 'OWNER' : apiary.members[0]?.role;

    if (!role) {
      throw new ForbiddenException('User has no valid role for this apiary');
    }

    // Add apiary context to request
    request.apiaryId = apiary.id;
    request.apiaryRole = role;

    return true;
  }
}
