import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';
import { CustomLoggerService } from '../logger/logger.service';
import {
  CreateAlert,
  UpdateAlert,
  AlertResponse,
  AlertFilter,
  AlertStatus,
  AlertSeverity,
} from 'shared-schemas';
import { AlertIssue } from './interfaces';

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLoggerService,
  ) {
    this.logger.setContext('AlertsService');
  }

  async create(createAlertDto: CreateAlert): Promise<AlertResponse> {
    this.logger.log(`Creating new alert of type: ${createAlertDto.type}`);

    const alert = await this.prisma.alert.create({
      data: {
        type: createAlertDto.type,
        message: createAlertDto.message,
        severity: createAlertDto.severity,
        metadata: createAlertDto.metadata as any,
        hiveId: createAlertDto.hiveId || null,
      },
    });

    this.logger.log(`Alert created with ID: ${alert.id}`);
    return this.mapToResponse(alert);
  }

  async findAll(
    filter: ApiaryUserFilter & AlertFilter,
  ): Promise<AlertResponse[]> {
    this.logger.log(
      `Finding alerts for apiary ${filter.apiaryId} and user ${filter.userId}`,
    );

    const where: any = {};

    // Add hive filter with apiary/user context
    if (filter.hiveId) {
      where.hive = {
        id: filter.hiveId,
        apiary: {
          id: filter.apiaryId,
          userId: filter.userId,
        },
      };
    } else {
      // If no specific hive, ensure all alerts belong to user's apiaries
      where.OR = [
        // Hive-specific alerts
        {
          hive: {
            apiary: {
              id: filter.apiaryId,
              userId: filter.userId,
            },
          },
        },
        // General alerts (no hiveId) - would need different context in future
        {
          hiveId: null,
        },
      ];
    }

    // Add other filters
    if (filter.type) where.type = filter.type;
    if (filter.severity) where.severity = filter.severity;
    if (filter.status) {
      where.status = filter.status;
    } else if (!filter.includeSuperseded) {
      // By default, exclude SUPERSEDED alerts
      where.status = {
        not: 'SUPERSEDED',
      };
    }

    const alerts = await this.prisma.alert.findMany({
      where,
      include: {
        hive: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return alerts.map((alert) => this.mapToResponse(alert));
  }

  async findOne(id: string, filter: ApiaryUserFilter): Promise<AlertResponse> {
    this.logger.log(`Finding alert with ID: ${id}`);

    const alert = await this.prisma.alert.findFirst({
      where: {
        id,
        OR: [
          // Hive-specific alerts
          {
            hive: {
              apiary: {
                id: filter.apiaryId,
                userId: filter.userId,
              },
            },
          },
          // General alerts (no hiveId)
          {
            hiveId: null,
          },
        ],
      },
      include: {
        hive: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!alert) {
      this.logger.warn(
        `Alert with ID: ${id} not found or user doesn't have access`,
      );
      throw new NotFoundException(`Alert with id ${id} not found`);
    }

    return this.mapToResponse(alert);
  }

  async update(
    id: string,
    updateAlertDto: UpdateAlert,
    filter: ApiaryUserFilter,
  ): Promise<AlertResponse> {
    this.logger.log(`Updating alert with ID: ${id}`);

    // Verify alert exists and user has access
    await this.findOne(id, filter);

    const updatedAlert = await this.prisma.alert.update({
      where: { id },
      data: updateAlertDto,
      include: {
        hive: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Alert with ID: ${id} updated successfully`);
    return this.mapToResponse(updatedAlert);
  }

  async dismiss(id: string, filter: ApiaryUserFilter): Promise<AlertResponse> {
    return this.update(id, { status: 'DISMISSED' }, filter);
  }

  async resolve(id: string, filter: ApiaryUserFilter): Promise<AlertResponse> {
    return this.update(id, { status: 'RESOLVED' }, filter);
  }

  async processIssues(hiveId: string, issues: AlertIssue[]): Promise<void> {
    this.logger.log(`Processing ${issues.length} issues for hive ${hiveId}`);

    for (const issue of issues) {
      await this.processIssue(hiveId, issue);
    }
  }

  private async processIssue(hiveId: string, issue: AlertIssue): Promise<void> {
    // Find existing active or dismissed alerts of the same type for this hive
    const existingAlerts = await this.prisma.alert.findMany({
      where: {
        hiveId,
        type: issue.type,
        status: {
          in: ['ACTIVE', 'DISMISSED'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Check if we have an active alert with the same severity
    const activeAlertWithSameSeverity = existingAlerts.find(
      (alert) => alert.status === 'ACTIVE' && alert.severity === issue.severity,
    );

    if (activeAlertWithSameSeverity) {
      // No change needed - alert already exists with same severity
      this.logger.debug(
        `Alert already exists for ${issue.type} with severity ${issue.severity}`,
      );
      return;
    }

    // Check if we have alerts with different severity
    const existingActiveAlert = existingAlerts.find(
      (alert) => alert.status === 'ACTIVE',
    );
    const existingDismissedAlert = existingAlerts.find(
      (alert) => alert.status === 'DISMISSED',
    );

    // If there's an active alert with different severity, supersede it
    if (
      existingActiveAlert &&
      existingActiveAlert.severity !== issue.severity
    ) {
      await this.prisma.alert.update({
        where: { id: existingActiveAlert.id },
        data: { status: 'SUPERSEDED' },
      });
      this.logger.log(
        `Superseded existing alert ${existingActiveAlert.id} due to severity change`,
      );
    }

    // If there's only a dismissed alert, we can create a new one (escalation)
    // If there was an active alert that we just superseded, create new one
    // If there are no existing alerts, create new one
    if (!activeAlertWithSameSeverity) {
      await this.prisma.alert.create({
        data: {
          hiveId,
          type: issue.type,
          message: issue.message,
          severity: issue.severity,
          metadata: issue.metadata,
          status: 'ACTIVE',
        },
      });
      this.logger.log(
        `Created new alert for ${issue.type} with severity ${issue.severity}`,
      );
    }
  }

  private mapToResponse(alert: any): AlertResponse {
    return {
      id: alert.id,
      hiveId: alert.hiveId || undefined,
      type: alert.type,
      message: alert.message,
      severity: alert.severity as AlertSeverity,
      status: alert.status as AlertStatus,
      metadata: alert.metadata || undefined,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
    };
  }
}
