import { format, formatDistanceToNowStrict } from 'date-fns';
import {
  HiveDetailResponse,
  InspectionResponse,
  InspectionStatus,
  ActionResponse,
} from 'shared-schemas';
import i18n from '@/lib/i18n';
import { getDateLocale } from '@/utils/locale-utils.ts';

function formatDate(date: string | Date): string {
  return format(new Date(date), 'P', { locale: getDateLocale(i18n.language), });
}

function getActionLabel(action: ActionResponse): string {
  switch (action.type) {
    case 'FEEDING':
      if (action.details?.type === 'FEEDING') {
        return (
          i18n.t('hive:llmPrompt.textArea.fed', {
            amount: action.details.amount,
            unit: action.details.unit,
            feedType: action.details.feedType,
            concentration: action.details.concentration
              ? ` (${action.details.concentration})`
              : '',
            defaultValue: 'Fed {{amount}} {{unit}} of {{feedType}}{{concentration}}',
          })
        );
      }
      return i18n.t('hive:llmPrompt.textArea.feeding', { defaultValue: 'Feeding' });
    case 'TREATMENT':
      if (action.details?.type === 'TREATMENT') {
        return (
          i18n.t('hive:llmPrompt.textArea.treatedWith', {
            product: action.details.product,
            quantity: action.details.quantity,
            unit: action.details.unit,
            defaultValue: 'Treated with {{product}} ({{quantity}} {{unit}})',
          })
        );
      }
      return i18n.t('hive:llmPrompt.textArea.treatment', { defaultValue: 'Treatment' });
    case 'FRAME':
      if (action.details?.type === 'FRAME') {
        return (
          action.details.quantity === 1
            ? i18n.t('hive:llmPrompt.textArea.addedFrame', {
                quantity: action.details.quantity,
                defaultValue: 'Added {{quantity}} frame',
              })
            : i18n.t('hive:llmPrompt.textArea.addedFrames', {
                quantity: action.details.quantity,
                defaultValue: 'Added {{quantity}} frames',
              })
        );
      }
      return (
        i18n.t('hive:llmPrompt.textArea.frameManagement', { defaultValue: 'Frame management' })
      );
    case 'HARVEST':
      if (action.details?.type === 'HARVEST') {
        return (
          i18n.t('hive:llmPrompt.textArea.harvested', {
            amount: action.details.amount,
            unit: action.details.unit,
            defaultValue: 'Harvested {{amount}} {{unit}}',
          })
        );
      }
      return i18n.t('hive:llmPrompt.textArea.harvest', { defaultValue: 'Harvest' });
    case 'NOTE':
      return i18n.t('hive:llmPrompt.textArea.note', { defaultValue: 'Note' });
    case 'BOX_CONFIGURATION':
      return (
        i18n.t('hive:llmPrompt.textArea.boxConfiguration', {
          defaultValue: 'Box configuration',
        })
      );
    case 'MAINTENANCE':
      if (action.details?.type === 'MAINTENANCE') {
        const comp = action.details.component.replace('_', ' ').toLowerCase();
        const stat = action.details.status.toLowerCase();
        return i18n.t('hive:llmPrompt.textArea.maintenance', {
          status: stat,
          component: comp,
          defaultValue: '{{status}} {{component}}',
        });
      }
      return i18n.t('hive:llmPrompt.textArea.maintenanceDefault', { defaultValue: 'Maintenance' });
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
  lines.push(i18n.t('hive:llmPrompt.textArea.description', { defaultValue: 'You are an experienced beekeeping advisor. Please analyze the following hive data and provide your assessment.' }));
  lines.push('');

  // Hive overview
  lines.push('## ' + i18n.t('hive:llmPrompt.textArea.hiveOverview', { defaultValue: 'Hive Overview', }),);
  lines.push('- ' + i18n.t('hive:llmPrompt.textArea.nameValue', { name: hive.name , defaultValue: 'Name: {{name}}' }));
  lines.push('- ' + i18n.t('hive:llmPrompt.textArea.statusValue', { status: hive.status, defaultValue: 'Status: {{status}}' }));
  if (hive.installationDate) {
    const installDate = new Date(hive.installationDate);
    const age = formatDistanceToNowStrict(installDate, { locale: getDateLocale(i18n.language) });
    const installDateLabel = i18n.t('hive:llmPrompt.textArea.installationDate', { defaultValue: 'Installation Date' });
    const oldLabel = i18n.t('hive:llmPrompt.textArea.old', { defaultValue: 'old' });
    lines.push(`- ${installDateLabel}: ${formatDate(hive.installationDate)} (${age} ${oldLabel})`);
  }
  if (hive.notes) {
    lines.push('- ' + i18n.t('hive:llmPrompt.textArea.notes', { notes: hive.notes, defaultValue: 'Notes: {{notes}}' }));
  }
  lines.push('');

  // Queen info
  lines.push('## ' + i18n.t('hive:llmPrompt.textArea.queenInformation', { defaultValue: 'Queen Information' }));
  if (hive.activeQueen) {
    const q = hive.activeQueen;
    if (q.status) lines.push('- ' + i18n.t('hive:llmPrompt.textArea.statusValue', { status: q.status, defaultValue: 'Status: {{status}}' }));
    if (q.year) lines.push('- ' + i18n.t('hive:llmPrompt.textArea.yearValue', { year: q.year, defaultValue: 'Year: {{year}}' }));
    if (q.marking) lines.push('- ' + i18n.t('hive:llmPrompt.textArea.markingValue', { marking: q.marking, defaultValue: 'Marking: {{marking}}' }));
    if (q.source) lines.push('- ' + i18n.t('hive:llmPrompt.textArea.sourceValue', { source: q.source, defaultValue: 'Source: {{source}}' }));
    if (q.installedAt) {
      lines.push('- ' + i18n.t('hive:llmPrompt.textArea.installedValue', { installedAt: formatDate(q.installedAt), defaultValue: 'Installed: {{installedAt}}' }));
    }
  } else {
    lines.push(i18n.t('hive:llmPrompt.textArea.noActiveQueenRecorded', { defaultValue: 'No active queen recorded.' }));
  }
  lines.push('');

  // Box configuration
  if (hive.boxes.length > 0) {
    lines.push('## ' + i18n.t('hive:llmPrompt.textArea.boxConfiguration', { defaultValue: 'Box Configuration' }));
    const sortedBoxes = [...hive.boxes].sort((a, b) => a.position - b.position);
    for (const box of sortedBoxes) {
      const parts = [i18n.t('hive:llmPrompt.textArea.position',{ position: box.position, type: box.type, defaultValue: 'Position {{position}}: {{type}}' })];
      if (box.variant) parts.push(i18n.t('hive:llmPrompt.textArea.variant', { variant: box.variant, defaultValue: 'variant={{variant}}' }));
      parts.push(`${box.frameCount} ${i18n.t('hive:llmPrompt.textArea.frames', { defaultValue: 'frames' })}`);
      if (box.hasExcluder) parts.push(i18n.t('hive:llmPrompt.textArea.withExcluder', { defaultValue: 'with excluder' }));
      if (box.winterized) parts.push(i18n.t('hive:llmPrompt.textArea.winterized', { defaultValue: 'winterized' }));
      lines.push(`- ${parts.join(', ')}`);
    }
    lines.push('');
  }

  // Health scores
  const score = hive.hiveScore;
  if (
    score &&
    (score.overallScore !== null ||
      score.populationScore !== null ||
      score.storesScore !== null ||
      score.queenScore !== null)
  ) {
    lines.push('## ' + i18n.t('hive:llmPrompt.textArea.healthScores', { defaultValue: 'Health Scores' }));
    if (score.overallScore !== null)
      lines.push('- ' + i18n.t('hive:llmPrompt.textArea.overallScore', { overallScore: score.overallScore, defaultValue: 'Overall: {{overallScore}}/10' }));
    if (score.populationScore !== null)
      lines.push('- ' + i18n.t('hive:llmPrompt.textArea.population', { populationScore: score.populationScore, defaultValue: 'Population: {{populationScore}}/10' }));
    if (score.storesScore !== null)
      lines.push('- ' + i18n.t('hive:llmPrompt.textArea.stores', { storesScore: score.storesScore, defaultValue: 'Stores: {{storesScore}}/10' }));
    if (score.queenScore !== null)
      lines.push('- ' + i18n.t('hive:llmPrompt.textArea.queen', { queenScore: score.queenScore, defaultValue: 'Queen: {{queenScore}}/10' }));
    if (score.warnings.length > 0) {
      lines.push('- ' + i18n.t('hive:llmPrompt.textArea.warnings', { warnings: score.warnings.join('; '), defaultValue: 'Warnings: {{warnings}}' }));
    }
    lines.push('');
  }

  // Active alerts
  const activeAlerts = hive.alerts.filter(a => a.status === 'ACTIVE');
  if (activeAlerts.length > 0) {
    lines.push('## ' + i18n.t('hive:llmPrompt.textArea.activeAlerts', { defaultValue: 'Active Alerts' }));
    for (const alert of activeAlerts) {
      lines.push(`- [${alert.severity}] ${alert.message}`);
    }
    lines.push('');
  }

  // Hive settings
  if (hive.settings) {
    lines.push('## ' + i18n.t('hive:llmPrompt.textArea.hiveSettings', { defaultValue: 'Hive Settings' }));
    if (hive.settings.inspection) {
      lines.push('- ' + i18n.t('hive:llmPrompt.textArea.inspectionFrequency', { frequencyDays: hive.settings.inspection.frequencyDays, defaultValue: 'Inspection frequency: every {{frequencyDays}} days' }));
    }
    if (hive.settings.autumnFeeding) {
      const af = hive.settings.autumnFeeding;
      lines.push('- ' + i18n.t('hive:llmPrompt.textArea.autumnFeeding', { amountKg: af.amountKg, startMonth: af.startMonth, endMonth: af.endMonth, defaultValue: 'Autumn feeding: {{amountKg}}kg, months {{startMonth}}-{{endMonth}}' }));
    }
    lines.push('');
  }

  // Recent inspections
  const completedInspections = (inspections ?? [])
    .filter(i => i.status === InspectionStatus.COMPLETED)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  if (completedInspections.length > 0) {
    lines.push('## ' + i18n.t('hive:llmPrompt.textArea.recentInspections', { completedInspections: completedInspections.length, defaultValue: 'Recent Inspections (last {{completedInspections}})' }));
    for (const insp of completedInspections) {
      lines.push('');
      lines.push(`### ${formatDate(insp.date)}`);
      if (insp.temperature !== null && insp.temperature !== undefined)
        lines.push('- ' + i18n.t('hive:llmPrompt.textArea.temperature', { temperature: insp.temperature, defaultValue: 'Temperature: {{temperature}}°C', }));
      if (insp.weatherConditions)
        lines.push('- ' + i18n.t('hive:llmPrompt.textArea.weather', { weatherConditions: insp.weatherConditions, defaultValue: 'Weather: {{weatherConditions}}' }));

      // Observations — only non-null fields
      if (insp.observations) {
        const obs = insp.observations;
        if (obs.strength !== null && obs.strength !== undefined)
          lines.push('- ' + i18n.t('hive:llmPrompt.textArea.colonyStrength', { strength: obs.strength, defaultValue: 'Colony strength: {{strength}}/10' }));
        if (obs.uncappedBrood !== null && obs.uncappedBrood !== undefined)
          lines.push('- ' + i18n.t('hive:llmPrompt.textArea.uncappedBrood', { uncappedBrood: obs.uncappedBrood, defaultValue: 'Uncapped brood: {{uncappedBrood}}/10' }));
        if (obs.cappedBrood !== null && obs.cappedBrood !== undefined)
          lines.push('- ' + i18n.t('hive:llmPrompt.textArea.cappedBrood', { cappedBrood: obs.cappedBrood, defaultValue: 'Capped brood: {{cappedBrood}}/10' }));
        if (obs.honeyStores !== null && obs.honeyStores !== undefined)
          lines.push('- ' + i18n.t('hive:llmPrompt.textArea.honeyStores', { honeyStores: obs.honeyStores, defaultValue: 'Honey stores: {{honeyStores}}/10' }));
        if (obs.pollenStores !== null && obs.pollenStores !== undefined)
          lines.push('- ' + i18n.t('hive:llmPrompt.textArea.pollenStores', { pollenStores: obs.pollenStores, defaultValue: 'Pollen stores: {{pollenStores}}/10' }));
        if (obs.queenCells !== null && obs.queenCells !== undefined)
          lines.push('- ' + i18n.t('hive:llmPrompt.textArea.queenCells', { queenCells: obs.queenCells, defaultValue: 'Queen cells: {{queenCells}}' }));
        const yes = i18n.t('hive:llmPrompt.textArea.llmPromptYes', { defaultValue: 'Yes' });
        const no = i18n.t('hive:llmPrompt.textArea.llmPromptNo', { defaultValue: 'No' });
        if (obs.swarmCells !== null && obs.swarmCells !== undefined) {
          lines.push('- ' + i18n.t('hive:llmPrompt.textArea.swarmCells', { swarmCells: obs.swarmCells ? yes : no, defaultValue: 'Swarm cells: {{swarmCells}}' }));
        }
        if (obs.supersedureCells !== null && obs.supersedureCells !== undefined)
          lines.push('- ' + i18n.t('hive:llmPrompt.textArea.supersedureCells', { supersedureCells: obs.supersedureCells ? yes : no, defaultValue: 'Supersedure cells: {{supersedureCells}}', }),);
        if (obs.queenSeen !== null && obs.queenSeen !== undefined)
          lines.push('- ' + i18n.t('hive:llmPrompt.textArea.queenSeen', { queenSeen: obs.queenSeen ? yes : no, defaultValue: 'Queen seen: {{queenSeen}}' }));
        if (obs.broodPattern)
          lines.push('- ' + i18n.t('hive:llmPrompt.textArea.broodPattern', { broodPattern: obs.broodPattern, defaultValue: 'Brood pattern: {{broodPattern}}' }));
        if (obs.additionalObservations && obs.additionalObservations.length > 0)
          lines.push('- ' + i18n.t('hive:llmPrompt.textArea.additionalObservations', { additionalObservations: obs.additionalObservations.join(', '), defaultValue: 'Additional observations: {{additionalObservations}}' }));
        if (obs.reminderObservations && obs.reminderObservations.length > 0)
          lines.push('- ' + i18n.t('hive:llmPrompt.textArea.reminderObservations', { reminderObservations: obs.reminderObservations.join(', '), defaultValue: 'Reminders: {{reminderObservations}}' }));
      }

      // Actions
      if (insp.actions && insp.actions.length > 0) {
        lines.push('- ' + i18n.t('hive:llmPrompt.textArea.actionsTaken', { defaultValue: 'Actions taken:' }));
        for (const action of insp.actions) {
          const label = getActionLabel(action as ActionResponse);
          lines.push(`  - ${label}${action.notes ? ` — ${action.notes}` : ''}`);
        }
      }

      if (insp.notes) {
        lines.push('- ' + i18n.t('hive:llmPrompt.textArea.notes', { notes: insp.notes, defaultValue: 'Notes: {{notes}}' }));
      }

      // Inspection score
      if (insp.score) {
        const s = insp.score;
        const scoreParts: string[] = [];
        if (s.overallScore !== null)
          scoreParts.push(i18n.t('hive:llmPrompt.textArea.overall', { overallScore: s.overallScore, defaultValue: 'overall={{overallScore}}' }));
        if (s.populationScore !== null)
          scoreParts.push(i18n.t('hive:llmPrompt.textArea.populationScore', { populationScore: s.populationScore, defaultValue: 'population={{populationScore}}' }));
        if (s.storesScore !== null)
          scoreParts.push(i18n.t('hive:llmPrompt.textArea.storesScore', { storesScore: s.storesScore, defaultValue: 'stores={{storesScore}}' }));
        if (s.queenScore !== null) scoreParts.push(i18n.t('hive:llmPrompt.textArea.queenScore', { queenScore: s.queenScore, defaultValue: 'queen={{queenScore}}' }));
        if (scoreParts.length > 0) {
          lines.push('- ' + i18n.t('hive:llmPrompt.textArea.scores', { scores: scoreParts.join(', '), defaultValue: 'Scores: {{scores}}' }));
        }
        if (s.warnings.length > 0) {
          lines.push('- ' + i18n.t('hive:llmPrompt.textArea.scoreWarnings', { scoreWarnings: s.warnings.join('; '), defaultValue: 'Score warnings: {{scoreWarnings}}' }));
        }
      }
    }
    lines.push('');
  } else {
    lines.push('## ' + i18n.t('hive:llmPrompt.textArea.noRecentInspections', { defaultValue: 'Recent Inspections' }));
    lines.push(i18n.t('hive:llmPrompt.textArea.noCompletedInspections', { defaultValue: 'No completed inspections recorded.' }));
    lines.push('');
  }

  // Closing
  lines.push('---');
  lines.push('');
  lines.push(i18n.t('hive:llmPrompt.textArea.closingPromptTitle', { defaultValue: 'Based on the data above, please provide:' }));
  lines.push('1. ' + i18n.t('hive:llmPrompt.textArea.closingPromptFirst', { defaultValue: 'An overall health assessment of this hive' }));
  lines.push('2. ' + i18n.t('hive:llmPrompt.textArea.closingPromptSecond', { defaultValue: 'Any concerns or issues you identify' }));
  lines.push('3. ' + i18n.t('hive:llmPrompt.textArea.closingPromptThird', { defaultValue: 'Recommended actions for the beekeeper' }));
  lines.push('4. ' + i18n.t('hive:llmPrompt.textArea.closingPromptFourth', { defaultValue: 'Seasonal considerations based on the inspection history' }));

  return lines.join('\n');
}
