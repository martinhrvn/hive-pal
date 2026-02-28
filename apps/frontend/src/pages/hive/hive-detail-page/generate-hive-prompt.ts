import { format, formatDistanceToNowStrict } from 'date-fns';
import {
  HiveDetailResponse,
  InspectionResponse,
  InspectionStatus,
  ActionResponse,
} from 'shared-schemas';

function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

function getActionLabel(action: ActionResponse): string {
  switch (action.type) {
    case 'FEEDING':
      if (action.details?.type === 'FEEDING') {
        return `Fed ${action.details.amount} ${action.details.unit} of ${action.details.feedType}${
          action.details.concentration
            ? ` (${action.details.concentration})`
            : ''
        }`;
      }
      return 'Feeding';
    case 'TREATMENT':
      if (action.details?.type === 'TREATMENT') {
        return `Treated with ${action.details.product} (${action.details.quantity} ${action.details.unit})`;
      }
      return 'Treatment';
    case 'FRAME':
      if (action.details?.type === 'FRAME') {
        return `Added ${action.details.quantity} frame${action.details.quantity !== 1 ? 's' : ''}`;
      }
      return 'Frame management';
    case 'HARVEST':
      if (action.details?.type === 'HARVEST') {
        return `Harvested ${action.details.amount} ${action.details.unit}`;
      }
      return 'Harvest';
    case 'NOTE':
      return 'Note';
    case 'BOX_CONFIGURATION':
      return 'Box configuration';
    default:
      return action.type;
  }
}

export function generateHivePrompt(
  hive: HiveDetailResponse,
  inspections: InspectionResponse[] | undefined,
): string {
  const lines: string[] = [];

  // Preamble
  lines.push(
    'You are an experienced beekeeping advisor. Please analyze the following hive data and provide your assessment.',
  );
  lines.push('');

  // Hive overview
  lines.push('## Hive Overview');
  lines.push(`- Name: ${hive.name}`);
  lines.push(`- Status: ${hive.status}`);
  if (hive.installationDate) {
    const installDate = new Date(hive.installationDate);
    const age = formatDistanceToNowStrict(installDate);
    lines.push(
      `- Installation Date: ${formatDate(hive.installationDate)} (${age} old)`,
    );
  }
  if (hive.notes) {
    lines.push(`- Notes: ${hive.notes}`);
  }
  lines.push('');

  // Queen info
  lines.push('## Queen Information');
  if (hive.activeQueen) {
    const q = hive.activeQueen;
    if (q.status) lines.push(`- Status: ${q.status}`);
    if (q.year) lines.push(`- Year: ${q.year}`);
    if (q.marking) lines.push(`- Marking: ${q.marking}`);
    if (q.source) lines.push(`- Source: ${q.source}`);
    if (q.installedAt) {
      lines.push(`- Installed: ${formatDate(q.installedAt)}`);
    }
  } else {
    lines.push('No active queen recorded.');
  }
  lines.push('');

  // Box configuration
  if (hive.boxes.length > 0) {
    lines.push('## Box Configuration');
    const sortedBoxes = [...hive.boxes].sort((a, b) => a.position - b.position);
    for (const box of sortedBoxes) {
      const parts = [`Position ${box.position}: ${box.type}`];
      if (box.variant) parts.push(`variant=${box.variant}`);
      parts.push(`${box.frameCount} frames`);
      if (box.hasExcluder) parts.push('with excluder');
      if (box.winterized) parts.push('winterized');
      lines.push(`- ${parts.join(', ')}`);
    }
    lines.push('');
  }

  // Health scores
  const score = hive.hiveScore;
  if (
    score.overallScore !== null ||
    score.populationScore !== null ||
    score.storesScore !== null ||
    score.queenScore !== null
  ) {
    lines.push('## Health Scores');
    if (score.overallScore !== null)
      lines.push(`- Overall: ${score.overallScore}/10`);
    if (score.populationScore !== null)
      lines.push(`- Population: ${score.populationScore}/10`);
    if (score.storesScore !== null)
      lines.push(`- Stores: ${score.storesScore}/10`);
    if (score.queenScore !== null)
      lines.push(`- Queen: ${score.queenScore}/10`);
    if (score.warnings.length > 0) {
      lines.push(`- Warnings: ${score.warnings.join('; ')}`);
    }
    lines.push('');
  }

  // Active alerts
  const activeAlerts = hive.alerts.filter(a => a.status === 'ACTIVE');
  if (activeAlerts.length > 0) {
    lines.push('## Active Alerts');
    for (const alert of activeAlerts) {
      lines.push(`- [${alert.severity}] ${alert.message}`);
    }
    lines.push('');
  }

  // Hive settings
  if (hive.settings) {
    lines.push('## Hive Settings');
    if (hive.settings.inspection) {
      lines.push(
        `- Inspection frequency: every ${hive.settings.inspection.frequencyDays} days`,
      );
    }
    if (hive.settings.autumnFeeding) {
      const af = hive.settings.autumnFeeding;
      lines.push(
        `- Autumn feeding: ${af.amountKg}kg, months ${af.startMonth}-${af.endMonth}`,
      );
    }
    lines.push('');
  }

  // Recent inspections
  const completedInspections = (inspections ?? [])
    .filter(i => i.status === InspectionStatus.COMPLETED)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  if (completedInspections.length > 0) {
    lines.push(`## Recent Inspections (last ${completedInspections.length})`);
    for (const insp of completedInspections) {
      lines.push('');
      lines.push(`### ${formatDate(insp.date)}`);

      if (insp.temperature !== null && insp.temperature !== undefined) {
        lines.push(`- Temperature: ${insp.temperature}°C`);
      }
      if (insp.weatherConditions) {
        lines.push(`- Weather: ${insp.weatherConditions}`);
      }

      // Observations — only non-null fields
      if (insp.observations) {
        const obs = insp.observations;
        if (obs.strength !== null && obs.strength !== undefined)
          lines.push(`- Colony strength: ${obs.strength}/10`);
        if (obs.uncappedBrood !== null && obs.uncappedBrood !== undefined)
          lines.push(`- Uncapped brood: ${obs.uncappedBrood}/10`);
        if (obs.cappedBrood !== null && obs.cappedBrood !== undefined)
          lines.push(`- Capped brood: ${obs.cappedBrood}/10`);
        if (obs.honeyStores !== null && obs.honeyStores !== undefined)
          lines.push(`- Honey stores: ${obs.honeyStores}/10`);
        if (obs.pollenStores !== null && obs.pollenStores !== undefined)
          lines.push(`- Pollen stores: ${obs.pollenStores}/10`);
        if (obs.queenCells !== null && obs.queenCells !== undefined)
          lines.push(`- Queen cells: ${obs.queenCells}`);
        if (obs.swarmCells !== null && obs.swarmCells !== undefined)
          lines.push(`- Swarm cells: ${obs.swarmCells ? 'Yes' : 'No'}`);
        if (obs.supersedureCells !== null && obs.supersedureCells !== undefined)
          lines.push(
            `- Supersedure cells: ${obs.supersedureCells ? 'Yes' : 'No'}`,
          );
        if (obs.queenSeen !== null && obs.queenSeen !== undefined)
          lines.push(`- Queen seen: ${obs.queenSeen ? 'Yes' : 'No'}`);
        if (obs.broodPattern)
          lines.push(`- Brood pattern: ${obs.broodPattern}`);
        if (obs.additionalObservations && obs.additionalObservations.length > 0)
          lines.push(
            `- Additional observations: ${obs.additionalObservations.join(', ')}`,
          );
        if (obs.reminderObservations && obs.reminderObservations.length > 0)
          lines.push(`- Reminders: ${obs.reminderObservations.join(', ')}`);
      }

      // Actions
      if (insp.actions && insp.actions.length > 0) {
        lines.push('- Actions taken:');
        for (const action of insp.actions) {
          const label = getActionLabel(action as ActionResponse);
          lines.push(`  - ${label}${action.notes ? ` — ${action.notes}` : ''}`);
        }
      }

      if (insp.notes) {
        lines.push(`- Notes: ${insp.notes}`);
      }

      // Inspection score
      if (insp.score) {
        const s = insp.score;
        const scoreParts: string[] = [];
        if (s.overallScore !== null)
          scoreParts.push(`overall=${s.overallScore}`);
        if (s.populationScore !== null)
          scoreParts.push(`population=${s.populationScore}`);
        if (s.storesScore !== null) scoreParts.push(`stores=${s.storesScore}`);
        if (s.queenScore !== null) scoreParts.push(`queen=${s.queenScore}`);
        if (scoreParts.length > 0) {
          lines.push(`- Scores: ${scoreParts.join(', ')}`);
        }
        if (s.warnings.length > 0) {
          lines.push(`- Score warnings: ${s.warnings.join('; ')}`);
        }
      }
    }
    lines.push('');
  } else {
    lines.push('## Recent Inspections');
    lines.push('No completed inspections recorded.');
    lines.push('');
  }

  // Closing
  lines.push('---');
  lines.push('');
  lines.push('Based on the data above, please provide:');
  lines.push('1. An overall health assessment of this hive');
  lines.push('2. Any concerns or issues you identify');
  lines.push('3. Recommended actions for the beekeeper');
  lines.push('4. Seasonal considerations based on the inspection history');

  return lines.join('\n');
}
