import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, format, startOfDay, isBefore } from 'date-fns';

interface HiveWithSettings {
  id: string;
  name: string;
  status: string;
  settings: {
    inspection?: {
      frequencyDays?: number;
    };
  } | null;
  lastInspectionDate: Date | null;
}

interface ICalEvent {
  uid: string;
  summary: string;
  dtstart: Date;
  description: string;
  isOverdue?: boolean;
}

@Injectable()
export class ICalService {
  private readonly FUTURE_WEEKS = 6;

  constructor(private prisma: PrismaService) {}

  async generateICalForApiary(
    apiaryId: string,
    userId: string,
  ): Promise<string> {
    // Get apiary to validate ownership and get name
    const apiary = await this.prisma.apiary.findFirst({
      where: {
        id: apiaryId,
        userId,
      },
    });

    if (!apiary) {
      throw new NotFoundException('Apiary not found');
    }

    // Get all active hives with their last completed inspection
    const hives = await this.prisma.hive.findMany({
      where: {
        apiaryId,
        apiary: {
          userId,
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        status: true,
        settings: true,
        inspections: {
          where: {
            status: 'COMPLETED',
          },
          orderBy: {
            date: 'desc',
          },
          take: 1,
          select: {
            date: true,
          },
        },
      },
    });

    // Map hives to include lastInspectionDate
    const hivesWithLastInspection: HiveWithSettings[] = hives.map((hive) => ({
      id: hive.id,
      name: hive.name,
      status: hive.status,
      settings: hive.settings as HiveWithSettings['settings'],
      lastInspectionDate: hive.inspections[0]?.date ?? null,
    }));

    // Generate scheduled inspection events
    const events = this.generateScheduledInspections(hivesWithLastInspection);

    // Generate iCal content
    return this.formatICalendar(apiary.name, events);
  }

  private generateScheduledInspections(hives: HiveWithSettings[]): ICalEvent[] {
    const events: ICalEvent[] = [];
    const today = startOfDay(new Date());
    const futureLimit = addDays(today, this.FUTURE_WEEKS * 7);

    for (const hive of hives) {
      if (hive.status !== 'ACTIVE') continue;

      const frequencyDays = hive.settings?.inspection?.frequencyDays ?? 7;

      let nextDue: Date;
      let isOverdue = false;

      if (!hive.lastInspectionDate) {
        // No inspections yet - due today
        nextDue = today;
        isOverdue = true;
      } else {
        nextDue = addDays(startOfDay(hive.lastInspectionDate), frequencyDays);
        isOverdue = isBefore(nextDue, today);
      }

      if (isOverdue) {
        // Add OVERDUE event for today
        events.push({
          uid: `overdue-${hive.id}-${format(today, 'yyyyMMdd')}@hivepal`,
          summary: `OVERDUE: ${hive.name} Inspection`,
          dtstart: today,
          description: `Inspection for ${hive.name} is overdue. Based on ${frequencyDays}-day frequency.`,
          isOverdue: true,
        });

        // Future inspections project from today
        nextDue = addDays(today, frequencyDays);
      }

      // Generate future inspections
      let currentDate = nextDue;
      while (
        isBefore(currentDate, futureLimit) ||
        currentDate.getTime() === futureLimit.getTime()
      ) {
        // Skip if this date is in the past (shouldn't happen but be safe)
        if (!isBefore(currentDate, today)) {
          events.push({
            uid: `scheduled-${hive.id}-${format(currentDate, 'yyyyMMdd')}@hivepal`,
            summary: `${hive.name} Inspection`,
            dtstart: currentDate,
            description: `Scheduled inspection for ${hive.name} (every ${frequencyDays} days)`,
          });
        }
        currentDate = addDays(currentDate, frequencyDays);
      }
    }

    // Sort events by date
    events.sort((a, b) => a.dtstart.getTime() - b.dtstart.getTime());

    return events;
  }

  private formatICalendar(apiaryName: string, events: ICalEvent[]): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HivePal//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:HivePal - ${this.escapeICalText(apiaryName)}`,
      `X-WR-CALDESC:Beekeeping schedule for ${this.escapeICalText(apiaryName)}`,
    ];

    const now = new Date();
    const dtstamp = this.formatICalDate(now, true);

    for (const event of events) {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${event.uid}`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART;VALUE=DATE:${this.formatICalDate(event.dtstart)}`);
      // All-day events: DTEND is the day after
      lines.push(
        `DTEND;VALUE=DATE:${this.formatICalDate(addDays(event.dtstart, 1))}`,
      );
      lines.push(`SUMMARY:${this.escapeICalText(event.summary)}`);
      lines.push(`DESCRIPTION:${this.escapeICalText(event.description)}`);
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    return lines.join('\r\n');
  }

  private formatICalDate(date: Date, includeTime = false): string {
    if (includeTime) {
      // UTC format: YYYYMMDDTHHMMSSZ
      return format(date, "yyyyMMdd'T'HHmmss'Z'");
    }
    // Date only: YYYYMMDD
    return format(date, 'yyyyMMdd');
  }

  private escapeICalText(text: string): string {
    // Escape special characters according to RFC 5545
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }
}
