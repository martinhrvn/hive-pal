import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApiaryContextGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: {
      headers: Record<string, string>;
      query: Record<string, string>;
      apiaryId: string | undefined;
      user?: { id: string };
    } = context.switchToHttp().getRequest();

    const apiaryId = request.headers['x-apiary-id'] || request.query.apiaryId;

    // If user is not authenticated, we can't proceed
    if (!request.user?.id) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Find the apiary and check if it belongs to the user
    const apiary = await this.prisma.apiary.findFirst({
      where: {
        id: apiaryId,
        userId: request.user.id,
      },
    });

    if (!apiary) {
      throw new NotFoundException(
        'Apiary not found or does not belong to the user',
      );
    }

    // Add apiary to request context
    request.apiaryId = apiaryId ? apiary.id : undefined;
    return true;
  }
}
