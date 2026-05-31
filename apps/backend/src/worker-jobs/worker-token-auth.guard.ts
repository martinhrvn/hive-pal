import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { WorkerTokensService } from '../worker-tokens/worker-tokens.service';

export interface AuthenticatedWorkerToken {
  id: string;
  name: string;
}

export interface WorkerRequest extends Request {
  workerToken: AuthenticatedWorkerToken;
}

const LAST_SEEN_DEBOUNCE_MS = 60_000;

@Injectable()
export class WorkerTokenAuthGuard implements CanActivate {
  private lastSeenWriteCache = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<WorkerRequest>();
    const header = req.headers['authorization'];
    if (
      !header ||
      typeof header !== 'string' ||
      !header.startsWith('Bearer ')
    ) {
      throw new UnauthorizedException('Missing worker bearer token');
    }
    const plaintext = header.slice('Bearer '.length).trim();
    if (!plaintext) {
      throw new UnauthorizedException('Empty worker bearer token');
    }
    const hash = WorkerTokensService.hashToken(plaintext);
    const token = await this.prisma.workerToken.findFirst({
      where: { tokenHash: hash, revokedAt: null },
      select: { id: true, name: true },
    });
    if (!token) {
      throw new UnauthorizedException('Invalid worker token');
    }

    req.workerToken = { id: token.id, name: token.name };

    const now = Date.now();
    const last = this.lastSeenWriteCache.get(token.id) ?? 0;
    if (now - last > LAST_SEEN_DEBOUNCE_MS) {
      this.lastSeenWriteCache.set(token.id, now);
      this.prisma.workerToken
        .update({
          where: { id: token.id },
          data: { lastSeenAt: new Date() },
        })
        .catch(() => {
          // best effort — don't fail request
        });
    }

    return true;
  }
}
