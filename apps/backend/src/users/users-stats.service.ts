import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomLoggerService } from '../logger/logger.service';
import {
  UserSummaryStats,
  UserDetailedStats,
  ActionBreakdown,
  ApiaryBreakdown,
} from 'shared-schemas';

@Injectable()
export class UsersStatsService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLoggerService,
  ) {
    this.logger.setContext('UsersStatsService');
  }

  /**
   * Get summary stats for multiple users (batch query for user list)
   */
  async getUsersSummaryStats(
    userIds: string[],
  ): Promise<Map<string, UserSummaryStats>> {
    this.logger.log(`Getting summary stats for ${userIds.length} users`);

    const statsMap = new Map<string, UserSummaryStats>();

    // Initialize empty stats for all users
    for (const userId of userIds) {
      statsMap.set(userId, {
        apiariesCount: 0,
        hivesCount: 0,
        inspectionsCount: 0,
        lastActivityDate: null,
      });
    }

    if (userIds.length === 0) {
      return statsMap;
    }

    // Get apiary counts per user
    const apiaries = await this.prisma.apiary.findMany({
      where: { userId: { in: userIds } },
      select: { id: true, userId: true },
    });

    const apiaryIdsByUser = new Map<string, string[]>();
    for (const apiary of apiaries) {
      const stats = statsMap.get(apiary.userId);
      if (stats) {
        stats.apiariesCount++;
      }
      const userApiaries = apiaryIdsByUser.get(apiary.userId) || [];
      userApiaries.push(apiary.id);
      apiaryIdsByUser.set(apiary.userId, userApiaries);
    }

    const allApiaryIds = apiaries.map((a) => a.id);

    if (allApiaryIds.length === 0) {
      return statsMap;
    }

    // Get hives grouped by apiary
    const hives = await this.prisma.hive.findMany({
      where: { apiaryId: { in: allApiaryIds } },
      select: { id: true, apiaryId: true },
    });

    const hiveIdsByUser = new Map<string, string[]>();
    const apiaryToUser = new Map<string, string>();
    for (const apiary of apiaries) {
      apiaryToUser.set(apiary.id, apiary.userId);
    }

    for (const hive of hives) {
      if (!hive.apiaryId) continue;
      const userId = apiaryToUser.get(hive.apiaryId);
      if (userId) {
        const stats = statsMap.get(userId);
        if (stats) {
          stats.hivesCount++;
        }
        const userHives = hiveIdsByUser.get(userId) || [];
        userHives.push(hive.id);
        hiveIdsByUser.set(userId, userHives);
      }
    }

    const allHiveIds = hives.map((h) => h.id);

    if (allHiveIds.length === 0) {
      return statsMap;
    }

    // Get inspection counts per hive
    const inspections = await this.prisma.inspection.findMany({
      where: { hiveId: { in: allHiveIds } },
      select: { id: true, hiveId: true, date: true },
    });

    const hiveToUser = new Map<string, string>();
    for (const [userId, hiveIds] of hiveIdsByUser) {
      for (const hiveId of hiveIds) {
        hiveToUser.set(hiveId, userId);
      }
    }

    const lastInspectionByUser = new Map<string, Date>();

    for (const inspection of inspections) {
      const userId = hiveToUser.get(inspection.hiveId);
      if (userId) {
        const stats = statsMap.get(userId);
        if (stats) {
          stats.inspectionsCount++;
        }
        const currentLast = lastInspectionByUser.get(userId);
        if (!currentLast || inspection.date > currentLast) {
          lastInspectionByUser.set(userId, inspection.date);
        }
      }
    }

    // Get last action dates per user
    const actions = await this.prisma.action.findMany({
      where: { hiveId: { in: allHiveIds } },
      select: { hiveId: true, date: true },
      orderBy: { date: 'desc' },
    });

    const lastActionByUser = new Map<string, Date>();

    for (const action of actions) {
      if (!action.hiveId) continue;
      const userId = hiveToUser.get(action.hiveId);
      if (userId) {
        const currentLast = lastActionByUser.get(userId);
        if (!currentLast || action.date > currentLast) {
          lastActionByUser.set(userId, action.date);
        }
      }
    }

    // Calculate last activity (max of last inspection and last action)
    for (const userId of userIds) {
      const stats = statsMap.get(userId);
      if (stats) {
        const lastInspection = lastInspectionByUser.get(userId);
        const lastAction = lastActionByUser.get(userId);

        let lastActivity: Date | null = null;
        if (lastInspection && lastAction) {
          lastActivity = lastInspection > lastAction ? lastInspection : lastAction;
        } else if (lastInspection) {
          lastActivity = lastInspection;
        } else if (lastAction) {
          lastActivity = lastAction;
        }

        stats.lastActivityDate = lastActivity ? lastActivity.toISOString() : null;
      }
    }

    return statsMap;
  }

  /**
   * Get detailed stats for a single user
   */
  async getUserDetailedStats(userId: string): Promise<UserDetailedStats> {
    this.logger.log(`Getting detailed stats for user ${userId}`);

    // Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get all apiaries with their hives
    const apiaries = await this.prisma.apiary.findMany({
      where: { userId },
      include: {
        hives: {
          select: { id: true },
        },
      },
    });

    const apiaryIds = apiaries.map((a) => a.id);
    const allHiveIds = apiaries.flatMap((a) => a.hives.map((h) => h.id));

    // Calculate totals
    const totalApiaries = apiaries.length;
    const totalHives = allHiveIds.length;

    // Get inspection counts and last dates
    let totalInspections = 0;
    let lastInspectionDate: Date | null = null;
    let lastActivityDate: Date | null = null;

    if (allHiveIds.length > 0) {
      // Total inspections
      totalInspections = await this.prisma.inspection.count({
        where: { hiveId: { in: allHiveIds } },
      });

      // Last inspection
      const lastInspection = await this.prisma.inspection.findFirst({
        where: { hiveId: { in: allHiveIds } },
        orderBy: { date: 'desc' },
        select: { date: true },
      });
      lastInspectionDate = lastInspection?.date || null;

      // Last action
      const lastAction = await this.prisma.action.findFirst({
        where: { hiveId: { in: allHiveIds } },
        orderBy: { date: 'desc' },
        select: { date: true },
      });

      // Calculate last activity
      if (lastInspection?.date && lastAction?.date) {
        lastActivityDate =
          lastInspection.date > lastAction.date
            ? lastInspection.date
            : lastAction.date;
      } else if (lastInspection?.date) {
        lastActivityDate = lastInspection.date;
      } else if (lastAction?.date) {
        lastActivityDate = lastAction.date;
      }
    }

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let recentInspectionsCount = 0;
    let recentActionsCount = 0;
    const actionsByType: ActionBreakdown[] = [];

    if (allHiveIds.length > 0) {
      recentInspectionsCount = await this.prisma.inspection.count({
        where: {
          hiveId: { in: allHiveIds },
          date: { gte: thirtyDaysAgo },
        },
      });

      const recentActions = await this.prisma.action.findMany({
        where: {
          hiveId: { in: allHiveIds },
          date: { gte: thirtyDaysAgo },
        },
        select: { type: true },
      });

      recentActionsCount = recentActions.length;

      // Group actions by type
      const typeCountMap = new Map<string, number>();
      for (const action of recentActions) {
        const current = typeCountMap.get(action.type) || 0;
        typeCountMap.set(action.type, current + 1);
      }

      for (const [type, count] of typeCountMap) {
        actionsByType.push({ type, count });
      }

      // Sort by count descending
      actionsByType.sort((a, b) => b.count - a.count);
    }

    // Per-apiary breakdown
    const apiaryBreakdown: ApiaryBreakdown[] = [];

    for (const apiary of apiaries) {
      const hiveIds = apiary.hives.map((h) => h.id);
      let inspectionsCount = 0;
      let apiaryLastInspection: Date | null = null;

      if (hiveIds.length > 0) {
        inspectionsCount = await this.prisma.inspection.count({
          where: { hiveId: { in: hiveIds } },
        });

        const lastInspection = await this.prisma.inspection.findFirst({
          where: { hiveId: { in: hiveIds } },
          orderBy: { date: 'desc' },
          select: { date: true },
        });
        apiaryLastInspection = lastInspection?.date || null;
      }

      apiaryBreakdown.push({
        apiaryId: apiary.id,
        apiaryName: apiary.name,
        apiaryLocation: apiary.location,
        latitude: apiary.latitude,
        longitude: apiary.longitude,
        hivesCount: hiveIds.length,
        inspectionsCount,
        lastInspectionDate: apiaryLastInspection
          ? apiaryLastInspection.toISOString()
          : null,
      });
    }

    return {
      userId: user.id,
      userName: user.name,
      email: user.email,
      summary: {
        totalApiaries,
        totalHives,
        totalInspections,
        lastActivityDate: lastActivityDate?.toISOString() || null,
        lastInspectionDate: lastInspectionDate?.toISOString() || null,
      },
      recentActivity: {
        period: 'last30days',
        inspectionsCount: recentInspectionsCount,
        actionsCount: recentActionsCount,
        actionsByType,
      },
      apiaryBreakdown,
    };
  }
}
