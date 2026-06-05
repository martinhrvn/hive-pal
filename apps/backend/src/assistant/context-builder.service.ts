import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HiveDetailResponse,
  HiveResponse,
  InspectionResponse,
  InspectionStatus,
  ActionResponse,
  ActionType,
} from 'shared-schemas';
import { HiveService } from '../hives/hive.service';
import { InspectionsService } from '../inspections/inspections.service';
import { CustomLoggerService } from '../logger/logger.service';

/**
 * Advisory disclaimer injected into every assistant system prompt.
 * Treatment advice is advisory only — products and dosing are regionally
 * regulated, so the model must never invent dosages.
 */
export const ASSISTANT_ADVISORY_DISCLAIMER = [
  'IMPORTANT — advisory only:',
  '- You are a beekeeping assistant. Your suggestions are advisory and do not replace the judgement of the beekeeper or a qualified inspector.',
  '- Treatment advice (e.g. varroa miticides) is regionally regulated. Product availability, approval and legal dosing differ by country/region.',
  '- NEVER invent or state specific miticide dosages or treatment quantities. Tell the beekeeper to follow the product label and local regulations.',
  '- Be conservative. Base your answer on the hive data provided below. Do not fabricate observations or history that are not present.',
].join('\n');

/**
 * Optional structured-suggestion protocol (per-hive scope only). When the
 * assistant recommends concrete next steps, it may append a single fenced
 * ```json block at the very END of its reply so the UI can offer one-click
 * "Create action" buttons. Prose comes first; the block is optional.
 */
export const ASSISTANT_SUGGESTION_INSTRUCTIONS = [
  'Optional structured suggestions:',
  'If — and only if — you recommend concrete actions for THIS hive, you may append a single fenced ```json code block at the very end of your reply containing a JSON array of suggestions. Write your normal advice as prose first.',
  'Each array item is one of:',
  '- { "kind": "action", "type": "FEEDING", "details": { "type": "FEEDING", "feedType": string, "amount": number, "unit": string, "concentration"?: string }, "reason": string }',
  '- { "kind": "action", "type": "TREATMENT", "details": { "type": "TREATMENT", "product": string, "unit": string, "quantity"?: number, "duration"?: string }, "reason": string }',
  '- { "kind": "action", "type": "FRAME", "details": { "type": "FRAME", "quantity": integer }, "reason": string }',
  '- { "kind": "action", "type": "MAINTENANCE", "details": { "type": "MAINTENANCE", "component": "BOX"|"BOTTOM_BOARD"|"COVER", "status": "CLEANED"|"REPLACED" }, "reason": string }',
  '- { "kind": "action", "type": "NOTE", "details": { "type": "NOTE", "content": string }, "reason": string }',
  '- { "kind": "reminder", "reminder": "honey_bound"|"overcrowded"|"needs_super"|"queen_issues"|"requires_treatment"|"low_stores"|"prepare_for_winter", "reason": string }',
  'For TREATMENT, do NOT invent a "quantity"/dose — omit it and tell the beekeeper to follow the product label and local regulations. Omit the block entirely if you have no concrete action to propose.',
].join('\n');

const DEFAULT_RECENT_INSPECTIONS = 5;
const DEFAULT_MAX_CONTEXT_CHARS = 8000;

export type AssistantScope =
  | { kind: 'hive'; apiaryId: string; hiveId: string; userId: string }
  | { kind: 'apiary'; apiaryId: string; userId: string };

@Injectable()
export class ContextBuilderService {
  constructor(
    private readonly hiveService: HiveService,
    private readonly inspectionsService: InspectionsService,
    private readonly config: ConfigService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('ContextBuilderService');
  }

  private get recentInspectionCount(): number {
    const raw = Number(this.config.get('ASSISTANT_CONTEXT_RECENT_INSPECTIONS'));
    return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_RECENT_INSPECTIONS;
  }

  private get maxContextChars(): number {
    const raw = Number(this.config.get('ASSISTANT_CONTEXT_MAX_CHARS'));
    return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_CONTEXT_CHARS;
  }

  /**
   * Build the full system message (role definition + advisory disclaimer +
   * freshly built, scope-specific hive data). Re-built on every turn so the
   * stateless LLM always sees current data.
   */
  async buildSystemMessage(scope: AssistantScope): Promise<string> {
    const body =
      scope.kind === 'hive'
        ? await this.buildHiveContext(scope)
        : await this.buildApiaryContext(scope);

    const intro =
      scope.kind === 'hive'
        ? 'You are an experienced beekeeping advisor helping with a single hive. Answer the beekeeper’s questions using the hive data below.'
        : 'You are an experienced beekeeping advisor helping manage an apiary. Use the per-hive summaries below to answer comparative questions (e.g. which hives need attention first).';

    return [
      intro,
      '',
      ASSISTANT_ADVISORY_DISCLAIMER,
      ...(scope.kind === 'hive' ? ['', ASSISTANT_SUGGESTION_INSTRUCTIONS] : []),
      '',
      '---',
      '',
      this.budget(body),
    ].join('\n');
  }

  /** Full context bundle for a single hive (ownership enforced by HiveService). */
  async buildHiveContext(scope: {
    apiaryId: string;
    hiveId: string;
    userId: string;
  }): Promise<string> {
    const filter = { apiaryId: scope.apiaryId, userId: scope.userId };
    const hive = await this.hiveService.findOne(scope.hiveId, filter);
    const inspections = await this.inspectionsService.findAll({
      apiaryId: scope.apiaryId,
      userId: scope.userId,
      hiveId: scope.hiveId,
    });
    return this.formatHiveBundle(hive, inspections);
  }

  /** Compact summary across all active hives in the apiary. */
  async buildApiaryContext(scope: {
    apiaryId: string;
    userId: string;
  }): Promise<string> {
    const hives = await this.hiveService.findAll({
      apiaryId: scope.apiaryId,
      userId: scope.userId,
    });
    return this.formatApiarySummary(hives);
  }

  // -- formatting helpers (pure, no i18n) -----------------------------------

  private formatApiarySummary(hives: HiveResponse[]): string {
    const lines: string[] = [];
    lines.push(`## Apiary Overview (${hives.length} active hives)`, '');

    if (hives.length === 0) {
      lines.push('No active hives recorded in this apiary.');
      return lines.join('\n');
    }

    for (const hive of hives) {
      lines.push(
        `### ${hive.name}`,
        `- Status: ${hive.status}`,
        `- Last inspection: ${
          hive.lastInspectionDate
            ? this.formatDate(hive.lastInspectionDate)
            : 'none recorded'
        }`,
      );
      if (
        hive.lastInspectionOverallScore !== null &&
        hive.lastInspectionOverallScore !== undefined
      ) {
        lines.push(
          `- Last health score: ${hive.lastInspectionOverallScore}/10`,
        );
      }
      const activeAlerts = (hive.alerts ?? []).filter(
        (a) => a.status === 'ACTIVE',
      );
      if (activeAlerts.length > 0) {
        lines.push(
          `- Active alerts: ${activeAlerts
            .map((a) => `[${a.severity}] ${a.message}`)
            .join('; ')}`,
        );
      }
      if (
        hive.lastInspectionWarnings &&
        hive.lastInspectionWarnings.length > 0
      ) {
        lines.push(
          `- Open reminders/warnings: ${hive.lastInspectionWarnings.join('; ')}`,
        );
      }
      lines.push('');
    }

    return lines.join('\n').trimEnd();
  }

  private formatHiveBundle(
    hive: HiveDetailResponse,
    inspections: InspectionResponse[] | undefined,
  ): string {
    const lines: string[] = [];

    // Hive overview
    lines.push(
      '## Hive Overview',
      `- Name: ${hive.name}`,
      `- Status: ${hive.status}`,
    );
    if (hive.installationDate) {
      lines.push(
        `- Installation date: ${this.formatDate(hive.installationDate)}`,
      );
    }
    if (hive.notes) lines.push(`- Notes: ${hive.notes}`);
    lines.push('');

    // Queen info
    lines.push('## Queen Information');
    if (hive.activeQueen) {
      const q = hive.activeQueen;
      if (q.status) lines.push(`- Status: ${q.status}`);
      if (q.year) lines.push(`- Year: ${q.year}`);
      if (q.marking) lines.push(`- Marking: ${q.marking}`);
      if (q.source) lines.push(`- Source: ${q.source}`);
      if (q.installedAt)
        lines.push(`- Installed: ${this.formatDate(q.installedAt)}`);
    } else {
      lines.push('No active queen recorded.');
    }
    lines.push('');

    // Box configuration
    if (hive.boxes.length > 0) {
      lines.push('## Box Configuration');
      const sorted = [...hive.boxes].sort((a, b) => a.position - b.position);
      for (const box of sorted) {
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
      score &&
      (score.overallScore !== null ||
        score.populationScore !== null ||
        score.storesScore !== null ||
        score.queenScore !== null)
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
      if (score.warnings.length > 0)
        lines.push(`- Warnings: ${score.warnings.join('; ')}`);
      lines.push('');
    }

    // Active alerts
    const activeAlerts = hive.alerts.filter((a) => a.status === 'ACTIVE');
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

    // Inspections — most recent N verbatim, older ones summarized
    const completed = (inspections ?? [])
      .filter((i) => i.status === InspectionStatus.COMPLETED)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (completed.length === 0) {
      lines.push('## Recent Inspections', 'No completed inspections recorded.');
      return lines.join('\n').trimEnd();
    }

    const n = this.recentInspectionCount;
    const verbatim = completed.slice(0, n);
    const older = completed.slice(n);

    lines.push(`## Recent Inspections (most recent ${verbatim.length})`);
    for (const insp of verbatim) {
      lines.push(...this.formatInspectionVerbatim(insp));
    }
    lines.push('');

    if (older.length > 0) {
      lines.push(`## Older Inspections (${older.length}, summarized)`);
      for (const insp of older) {
        lines.push(`- ${this.formatInspectionSummary(insp)}`);
      }
      lines.push('');
    }

    return lines.join('\n').trimEnd();
  }

  private formatInspectionVerbatim(insp: InspectionResponse): string[] {
    const lines: string[] = ['', `### ${this.formatDate(insp.date)}`];
    if (insp.temperature !== null && insp.temperature !== undefined)
      lines.push(`- Temperature: ${insp.temperature}°C`);
    if (insp.weatherConditions)
      lines.push(`- Weather: ${insp.weatherConditions}`);

    lines.push(...this.formatInspectionObservations(insp.observations));
    lines.push(...this.formatInspectionActions(insp.actions));

    if (insp.notes) lines.push(`- Notes: ${insp.notes}`);

    lines.push(...this.formatInspectionScore(insp.score));

    return lines;
  }

  private formatInspectionObservations(
    obs: InspectionResponse['observations'],
  ): string[] {
    if (!obs) return [];
    const lines: string[] = [];
    const yn = (v: boolean) => (v ? 'Yes' : 'No');
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
      lines.push(`- Swarm cells: ${yn(obs.swarmCells)}`);
    if (obs.supersedureCells !== null && obs.supersedureCells !== undefined)
      lines.push(`- Supersedure cells: ${yn(obs.supersedureCells)}`);
    if (obs.queenSeen !== null && obs.queenSeen !== undefined)
      lines.push(`- Queen seen: ${yn(obs.queenSeen)}`);
    if (obs.broodPattern) lines.push(`- Brood pattern: ${obs.broodPattern}`);
    if (obs.additionalObservations && obs.additionalObservations.length > 0)
      lines.push(
        `- Additional observations: ${obs.additionalObservations.join(', ')}`,
      );
    if (obs.reminderObservations && obs.reminderObservations.length > 0)
      lines.push(`- Reminders: ${obs.reminderObservations.join(', ')}`);
    return lines;
  }

  private formatInspectionActions(
    actions: InspectionResponse['actions'],
  ): string[] {
    if (!actions || actions.length === 0) return [];
    const lines: string[] = ['- Actions taken:'];
    for (const action of actions) {
      const label = this.getActionLabel(action as ActionResponse);
      lines.push(`  - ${label}${action.notes ? ` — ${action.notes}` : ''}`);
    }
    return lines;
  }

  private formatInspectionScore(score: InspectionResponse['score']): string[] {
    if (!score) return [];
    const lines: string[] = [];
    const parts: string[] = [];
    if (score.overallScore !== null)
      parts.push(`overall=${score.overallScore}`);
    if (score.populationScore !== null)
      parts.push(`population=${score.populationScore}`);
    if (score.storesScore !== null) parts.push(`stores=${score.storesScore}`);
    if (score.queenScore !== null) parts.push(`queen=${score.queenScore}`);
    if (parts.length > 0) lines.push(`- Scores: ${parts.join(', ')}`);
    if (score.warnings.length > 0)
      lines.push(`- Score warnings: ${score.warnings.join('; ')}`);
    return lines;
  }

  private formatInspectionSummary(insp: InspectionResponse): string {
    const parts: string[] = [this.formatDate(insp.date)];
    if (
      insp.score?.overallScore !== null &&
      insp.score?.overallScore !== undefined
    )
      parts.push(`score ${insp.score.overallScore}/10`);
    const reminders = insp.observations?.reminderObservations;
    if (reminders && reminders.length > 0)
      parts.push(`reminders: ${reminders.join(', ')}`);
    if (insp.actions && insp.actions.length > 0)
      parts.push(
        `actions: ${insp.actions
          .map((a) => this.getActionLabel(a as ActionResponse))
          .join(', ')}`,
      );
    return parts.join(' — ');
  }

  private getActionLabel(action: ActionResponse): string {
    switch (action.type) {
      case ActionType.FEEDING:
        return this.formatFeedingLabel(action);
      case ActionType.TREATMENT:
        return this.formatTreatmentLabel(action);
      case ActionType.FRAME:
        return this.formatFrameLabel(action);
      case ActionType.HARVEST:
        return this.formatHarvestLabel(action);
      case ActionType.NOTE:
        return 'Note';
      case ActionType.BOX_CONFIGURATION:
        return 'Box configuration';
      case ActionType.MAINTENANCE:
        return this.formatMaintenanceLabel(action);
      default:
        return action.type;
    }
  }

  private formatFeedingLabel(action: ActionResponse): string {
    if (action.details?.type === ActionType.FEEDING) {
      return `Fed ${action.details.amount} ${action.details.unit} of ${action.details.feedType}${
        action.details.concentration ? ` (${action.details.concentration})` : ''
      }`;
    }
    return 'Feeding';
  }

  private formatTreatmentLabel(action: ActionResponse): string {
    if (action.details?.type === ActionType.TREATMENT) {
      return `Treated with ${action.details.product} (${action.details.quantity} ${action.details.unit})`;
    }
    return 'Treatment';
  }

  private formatFrameLabel(action: ActionResponse): string {
    if (action.details?.type === ActionType.FRAME) {
      const q = action.details.quantity;
      return q === 1 ? 'Added 1 frame' : `Added ${q} frames`;
    }
    return 'Frame management';
  }

  private formatHarvestLabel(action: ActionResponse): string {
    if (action.details?.type === ActionType.HARVEST) {
      return `Harvested ${action.details.amount} ${action.details.unit}`;
    }
    return 'Harvest';
  }

  private formatMaintenanceLabel(action: ActionResponse): string {
    if (action.details?.type === ActionType.MAINTENANCE) {
      const comp = action.details.component.replace('_', ' ').toLowerCase();
      const stat = action.details.status.toLowerCase();
      return `${stat} ${comp}`;
    }
    return 'Maintenance';
  }

  private formatDate(date: string | Date): string {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return String(date);
    return d.toISOString().slice(0, 10);
  }

  /** Cap the rendered context so it fits the small model's window. */
  private budget(body: string): string {
    const max = this.maxContextChars;
    if (body.length <= max) return body;
    return (
      body.slice(0, max) +
      '\n\n[...context truncated to fit the model context window...]'
    );
  }
}
