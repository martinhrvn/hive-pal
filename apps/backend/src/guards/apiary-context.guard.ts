import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiaryMemberRole } from '@/prisma/client';

@Injectable()
export class ApiaryContextGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: {
      headers: Record<string, string>;
      query: Record<string, string>;
      apiaryId: string | undefined;
      apiaryRole: ApiaryMemberRole | undefined;
      user?: { id: string };
    } = context.switchToHttp().getRequest();

    const apiaryId = request.headers['x-apiary-id'] || request.query.apiaryId;

    if (!request.user?.id) {
      throw new ForbiddenException('User is not authenticated');
    }

    if (!apiaryId) {
      throw new NotFoundException('Apiary ID is required');
    }

    // Resolve access through the ApiaryMember table (accepted memberships only)
    const membership = await this.prisma.apiaryMember.findFirst({
      where: {
        apiaryId,
        userId: request.user.id,
        acceptedAt: { not: null },
      },
    });

    if (!membership) {
      throw new NotFoundException(
        'Apiary not found or you do not have access',
      );
    }

    request.apiaryId = membership.apiaryId;
    request.apiaryRole = membership.role;
    return true;
  }
}
