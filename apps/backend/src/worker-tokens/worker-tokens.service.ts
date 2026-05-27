import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const TOKEN_PREFIX = 'hpw_';
const TOKEN_RANDOM_BYTES = 24; // 24 bytes -> 32 base64url chars

@Injectable()
export class WorkerTokensService {
  constructor(private readonly prisma: PrismaService) {}

  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateToken(): { plaintext: string; hash: string; prefix: string } {
    const random = randomBytes(TOKEN_RANDOM_BYTES).toString('base64url');
    const plaintext = `${TOKEN_PREFIX}${random}`;
    return {
      plaintext,
      hash: WorkerTokensService.hashToken(plaintext),
      prefix: plaintext.slice(0, 12),
    };
  }

  async create(name: string, createdById: string) {
    const { plaintext, hash, prefix } = this.generateToken();

    const created = await this.prisma.workerToken.create({
      data: {
        name,
        tokenHash: hash,
        prefix,
        createdById,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        createdAt: true,
        lastSeenAt: true,
        revokedAt: true,
      },
    });

    return { ...created, token: plaintext };
  }

  async list() {
    return this.prisma.workerToken.findMany({
      select: {
        id: true,
        name: true,
        prefix: true,
        createdAt: true,
        lastSeenAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(id: string) {
    const token = await this.prisma.workerToken.findUnique({ where: { id } });
    if (!token) {
      throw new NotFoundException(`Worker token with id ${id} not found`);
    }
    if (token.revokedAt) {
      return {
        id: token.id,
        name: token.name,
        prefix: token.prefix,
        createdAt: token.createdAt,
        lastSeenAt: token.lastSeenAt,
        revokedAt: token.revokedAt,
      };
    }
    return this.prisma.workerToken.update({
      where: { id },
      data: { revokedAt: new Date() },
      select: {
        id: true,
        name: true,
        prefix: true,
        createdAt: true,
        lastSeenAt: true,
        revokedAt: true,
      },
    });
  }
}
