import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApiaryContextGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: {
      headers: Record<string, string>;
      query: Record<string, string>;
      apiaryId: string;
    } = context.switchToHttp().getRequest();
    const apiaryId = request.headers['x-apiary-id'] || request.query.apiaryId;

    const apiary = await this.prisma.apiary.findUnique({
      where: { id: apiaryId },
    });

    if (!apiary) {
      throw new NotFoundException('Apiary not found');
    }

    // Add apiary to request context
    request.apiaryId = apiaryId;
    return true;
  }
}
