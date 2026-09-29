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
import { APIARY_OPTIONAL_KEY } from './apiary-optional.decorator';

/**
 * Reserved `x-apiary-id` value that explicitly selects the cross-apiary
 * scope. Equivalent to sending no header at all on an `@ApiaryOptional()`
 * handler.
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

    // If user is not authenticated, we can't proceed
    if (!request.user?.id) {
      throw new ForbiddenException('User is not authenticated');
    }

    const apiaryId = request.headers['x-apiary-id'] || request.query.apiaryId;

    // No concrete apiary: either the header is absent or it is the reserved
    // "all" value. Handlers that opt in via @ApiaryOptional() run in the
    // cross-apiary scope (reads span the user's apiaries, writes authorize at
    // the resource level). Every other handler still requires the header,
    // because its service filters by a single apiaryId and would otherwise
    // run an unscoped query.
    if (!apiaryId || apiaryId === ALL_APIARIES) {
      const apiaryOptional = this.reflector.getAllAndOverride<boolean>(
        APIARY_OPTIONAL_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (!apiaryOptional) {
        throw new BadRequestException(
          'Apiary ID is required for this endpoint ' +
            '(x-apiary-id header or apiaryId query parameter)',
        );
      }
      request.allApiaries = true;
      request.apiaryId = undefined;
      request.apiaryRole = undefined;
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

    // Add apiary context to request. For @ApiaryOptional() handlers this is a
    // filter (reads) or ignored (writes); for legacy handlers it is the
    // authorization boundary.
    request.apiaryId = apiary.id;
    request.apiaryRole = role;

    return true;
  }
}
