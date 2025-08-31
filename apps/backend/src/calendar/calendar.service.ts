import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { 
  InspectionResponse, 
  ActionResponse,
  InspectionStatus,
  CalendarFilter,
  CalendarEvent,
  CalendarResponse
} from 'shared-schemas';
import { ApiaryUserFilter } from '../interface/request-with.apiary';
import { ActionsService } from '../actions/actions.service';
import { MetricsService } from '../metrics/metrics.service';
import { InspectionStatusUpdaterService } from '../inspections/inspection-status-updater.service';

@Injectable()
export class CalendarService {
  constructor(
    private prisma: PrismaService,
    private actionsService: ActionsService,
    private metricService: MetricsService,
    private inspectionStatusUpdater: InspectionStatusUpdaterService,
  ) {}

  async getCalendarEvents(
    filter: CalendarFilter & ApiaryUserFilter,
  ): Promise<CalendarResponse> {
    // Update any overdue inspection statuses before fetching
    await this.inspectionStatusUpdater.checkAndUpdateInspectionStatuses();

    // Build base where clause for both inspections and actions
    const baseWhereClause = {
      // Filter by hive if specified
      ...(filter.hiveId && { hiveId: filter.hiveId }),
      // Ensure data belongs to the user's apiary
      hive: {
        apiary: {
          id: filter.apiaryId,
          userId: filter.userId,
        },
      },
    };

    // Add date filtering
    const dateFilter = filter.startDate || filter.endDate
      ? {
          date: {
            ...(filter.startDate && { gte: new Date(filter.startDate) }),
            ...(filter.endDate && { lte: new Date(filter.endDate) }),
          },
        }
      : {};

    // Fetch inspections and standalone actions in parallel for better performance
    const [inspections, standaloneActions] = await Promise.all([
      // Get inspections with their related actions
      this.prisma.inspection.findMany({
        where: {
          ...baseWhereClause,
          ...dateFilter,
        },
        orderBy: [{ date: 'desc' }, { id: 'asc' }],
        include: {
          observations: true,
          notes: true,
          actions: {
            include: {
              feedingAction: true,
              treatmentAction: true,
              frameAction: true,
              harvestAction: true,
              boxConfigurationAction: true,
            },
          },
          hive: {
            select: {
              name: true,
              apiary: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      // Get standalone actions (not tied to any inspection)
      this.prisma.action.findMany({
        where: {
          ...baseWhereClause,
          ...dateFilter,
          inspectionId: null, // Only standalone actions
        },
        orderBy: [{ date: 'desc' }, { id: 'asc' }],
        include: {
          feedingAction: true,
          treatmentAction: true,
          frameAction: true,
          harvestAction: true,
          boxConfigurationAction: true,
          hive: {
            select: {
              name: true,
              apiary: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Transform inspections to DTOs
    const inspectionResponses: InspectionResponse[] = inspections.map((inspection) => {
      const metrics = this.mapObservationsToDto(inspection.observations);
      const score = this.metricService.calculateOveralScore(metrics);
      
      // Transform actions to DTOs
      const actions = inspection.actions.map((action) =>
        this.actionsService.mapPrismaToDto(action),
      );

      return {
        id: inspection.id,
        hiveId: inspection.hiveId,
        date: inspection.date.toISOString(),
        temperature: inspection.temperature ?? null,
        weatherConditions: inspection.weatherConditions ?? null,
        notes: inspection.notes?.[0]?.text ?? null,
        observations: metrics,
        status: inspection.status as InspectionStatus,
        score,
        actions,
      };
    });

    // Transform standalone actions to DTOs
    const standaloneActionResponses: ActionResponse[] = standaloneActions.map((action) =>
      this.actionsService.mapPrismaToDto(action),
    );

    // Group events by date
    const eventsByDate = new Map<string, CalendarEvent>();

    // Process inspections
    inspectionResponses.forEach((inspection) => {
      const dateKey = inspection.date.split('T')[0]; // Get date part only
      
      if (!eventsByDate.has(dateKey)) {
        eventsByDate.set(dateKey, {
          date: dateKey,
          inspections: [],
          standaloneActions: [],
        });
      }
      
      eventsByDate.get(dateKey)!.inspections.push(inspection);
    });

    // Process standalone actions
    standaloneActionResponses.forEach((action) => {
      const dateKey = action.date.split('T')[0]; // Get date part only
      
      if (!eventsByDate.has(dateKey)) {
        eventsByDate.set(dateKey, {
          date: dateKey,
          inspections: [],
          standaloneActions: [],
        });
      }
      
      eventsByDate.get(dateKey)!.standaloneActions.push(action);
    });

    // Convert map to array and sort by date (most recent first)
    return Array.from(eventsByDate.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  // Helper method to map observations (copied from inspections service)
  private mapObservationsToDto(observations: any[]) {
    const observationMap = observations.reduce((acc, obs) => {
      acc[obs.type] = obs.numericValue;
      return acc;
    }, {});

    return {
      strength: observationMap.strength ?? null,
      uncappedBrood: observationMap.uncapped_brood ?? null,
      cappedBrood: observationMap.capped_brood ?? null,
      honeyStores: observationMap.honey_stores ?? null,
      pollenStores: observationMap.pollen_stores ?? null,
      queenCells: observationMap.queen_cells ?? null,
      swarmCells: observationMap.swarm_cells ?? null,
      supersedureCells: observationMap.supersedure_cells ?? null,
      queenSeen: observationMap.queen_seen ?? null,
      eggs: observationMap.eggs ?? null,
      larvae: observationMap.larvae ?? null,
    };
  }
}