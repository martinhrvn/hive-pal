import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { hashApiKey } from '../api-key.util';

export interface RequestWithApiKey extends Request {
  apiaryId: string;
  apiKeyId: string;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithApiKey>();
    const header = request.headers['x-api-key'];
    const raw = Array.isArray(header) ? header[0] : header;

    if (!raw) {
      throw new UnauthorizedException('Missing X-Api-Key header');
    }

    const keyHash = hashApiKey(raw);
    const key = await this.prisma.apiaryApiKey.findUnique({
      where: { keyHash },
      select: { id: true, apiaryId: true, revokedAt: true },
    });

    if (!key || key.revokedAt) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.apiaryId = key.apiaryId;
    request.apiKeyId = key.id;

    void this.prisma.apiaryApiKey
      .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);

    return true;
  }
}
