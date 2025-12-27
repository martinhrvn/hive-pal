import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformMetricsSnapshot } from '@prisma/client';

@Injectable()
export class PlatformMetricsService {
  private readonly logger = new Logger(PlatformMetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate current platform metrics
   */
  async calculateCurrentMetrics(): Promise<
    Omit<PlatformMetricsSnapshot, 'id' | 'createdAt'>
  > {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Run all counts in parallel for efficiency
    const [
      totalUsers,
      totalApiaries,
      totalHives,
      totalInspections,
      totalActions,
      totalQueens,
      totalHarvests,
      totalEquipmentItems,
      activeUsers7Days,
      activeUsers30Days,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.apiary.count(),
      this.prisma.hive.count(),
      this.prisma.inspection.count(),
      this.prisma.action.count(),
      this.prisma.queen.count(),
      this.prisma.harvest.count(),
      this.prisma.equipmentItem.count(),
      this.countActiveUsers(sevenDaysAgo),
      this.countActiveUsers(thirtyDaysAgo),
    ]);

    return {
      date: today,
      totalUsers,
      totalApiaries,
      totalHives,
      totalInspections,
      totalActions,
      totalQueens,
      totalHarvests,
      totalEquipmentItems,
      activeUsers7Days,
      activeUsers30Days,
    };
  }

  /**
   * Count active users based on inspection/action activity
   * A user is considered active if they have created inspections or actions since the given date
   */
  private async countActiveUsers(since: Date): Promise<number> {
    // Find users who have inspections or actions created since the date
    const activeUserIds = await this.prisma.$queryRaw<{ userId: string }[]>`
      SELECT DISTINCT a."userId"
      FROM "Apiary" a
      WHERE EXISTS (
        SELECT 1 FROM "Hive" h
        JOIN "Inspection" i ON i."hiveId" = h.id
        WHERE h."apiaryId" = a.id AND i."date" >= ${since}
      )
      OR EXISTS (
        SELECT 1 FROM "Hive" h
        JOIN "Action" act ON act."hiveId" = h.id
        WHERE h."apiaryId" = a.id AND act."date" >= ${since}
      )
    `;

    return activeUserIds.length;
  }

  /**
   * Record a metrics snapshot (upsert for today)
   */
  async recordSnapshot(): Promise<PlatformMetricsSnapshot> {
    const metrics = await this.calculateCurrentMetrics();

    return this.prisma.platformMetricsSnapshot.upsert({
      where: { date: metrics.date },
      create: metrics,
      update: {
        totalUsers: metrics.totalUsers,
        totalApiaries: metrics.totalApiaries,
        totalHives: metrics.totalHives,
        totalInspections: metrics.totalInspections,
        totalActions: metrics.totalActions,
        totalQueens: metrics.totalQueens,
        totalHarvests: metrics.totalHarvests,
        totalEquipmentItems: metrics.totalEquipmentItems,
        activeUsers7Days: metrics.activeUsers7Days,
        activeUsers30Days: metrics.activeUsers30Days,
      },
    });
  }

  /**
   * Get metrics snapshots for a date range
   */
  async getSnapshots(
    startDate?: Date,
    endDate?: Date,
  ): Promise<PlatformMetricsSnapshot[]> {
    const where: { date?: { gte?: Date; lte?: Date } } = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    return this.prisma.platformMetricsSnapshot.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Get latest snapshot
   */
  async getLatestSnapshot(): Promise<PlatformMetricsSnapshot | null> {
    return this.prisma.platformMetricsSnapshot.findFirst({
      orderBy: { date: 'desc' },
    });
  }
}
