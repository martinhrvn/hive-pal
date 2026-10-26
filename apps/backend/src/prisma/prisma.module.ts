import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// The single PrismaService for the whole app. Every PrismaClient owns its own
// pg pool, so feature modules must inject this one rather than listing
// PrismaService in their own `providers` (each listing creates another pool,
// which is how prod ran out of Postgres connections).
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
