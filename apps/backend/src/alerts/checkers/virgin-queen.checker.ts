import { Injectable } from '@nestjs/common';
import {
  HiveChecker,
  HiveContext,
  CheckerContext,
  AlertIssue,
} from '../interfaces';
import { VIRGIN_QUEEN_CHECK_DAYS, virginQueenSince } from 'shared-schemas';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class VirginQueenChecker extends HiveChecker {
  getCheckerType(): string {
    return 'virgin_queen';
  }

  protected getDisplayName(): string {
    return 'Virgin Queen';
  }

  checkHive(hive: HiveContext, context: CheckerContext): AlertIssue[] {
    const queen = hive.currentQueen;
    if (hive.status !== 'ACTIVE' || queen?.status !== 'VIRGIN') return [];

    const virginSince = virginQueenSince(queen);
    const daysVirgin = Math.floor(
      (context.currentTime.getTime() - virginSince.getTime()) / DAY_MS,
    );
    if (daysVirgin < VIRGIN_QUEEN_CHECK_DAYS) return [];

    const queenName =
      queen.name || queen.marking || `Queen ${queen.year ?? ''}`.trim();
    return [
      {
        type: this.getCheckerType(),
        message: `Check for eggs: ${queenName} in hive "${hive.name}" has been a virgin queen for ${daysVirgin} days`,
        severity: 'MEDIUM',
        metadata: {
          queenId: queen.id,
          queenName,
          hiveName: hive.name,
          daysVirgin,
          virginSince: virginSince.toISOString(),
        },
      },
    ];
  }
}
