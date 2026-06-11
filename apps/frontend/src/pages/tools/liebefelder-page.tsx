import { useState, useMemo } from 'react';
import {
  Lightbulb,
  Bug,
  Minus,
  Plus,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  PageGrid,
  MainContent,
  PageAside,
} from '@/components/layout/page-grid-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pill } from '@/components/common/pill';
import { ToolMeta, ToolPageHeader, TipsCard } from '@/components/tool-page';

// Estimation values per 1/8 of a comb side, from Dr. Pia Aumeier's
// population-estimation cheat sheet ("Durchzählen bitte!").
const FRAME_TYPES = [
  {
    id: 'zander',
    label: 'Zander',
    dimensions: '420×220 mm',
    perEighth: { bees: 125, drones: 100, workerBroodCells: 400, droneBroodCells: 230, pollenG: 40, feedG: 125 },
  },
  {
    id: 'dnm',
    label: 'Deutsch-Normal',
    dimensions: '370×223 mm',
    perEighth: { bees: 111, drones: 89, workerBroodCells: 357, droneBroodCells: 205, pollenG: 36, feedG: 111 },
  },
  {
    id: 'langstroth',
    label: 'Langstroth',
    dimensions: '448×232 mm',
    perEighth: { bees: 140, drones: 112, workerBroodCells: 450, droneBroodCells: 259, pollenG: 45, feedG: 140 },
  },
  {
    id: 'dadant',
    label: 'Dadant',
    dimensions: '448×285 mm',
    perEighth: { bees: 176, drones: 141, workerBroodCells: 564, droneBroodCells: 324, pollenG: 56, feedG: 176 },
  },
] as const;

type FrameTypeId = (typeof FRAME_TYPES)[number]['id'] | 'custom';
type PerEighth = (typeof FRAME_TYPES)[number]['perEighth'];

const PER_EIGHTH_FIELDS = [
  { id: 'bees' as const, unit: '' },
  { id: 'drones' as const, unit: '' },
  { id: 'workerBroodCells' as const, unit: '' },
  { id: 'droneBroodCells' as const, unit: '' },
  { id: 'pollenG' as const, unit: 'g' },
  { id: 'feedG' as const, unit: 'g' },
];

// All quantities are counted directly as total eighths across all comb sides.
const CONTENT_FIELDS = [
  { id: 'bees' as const },
  { id: 'cappedWorkerBrood' as const },
  { id: 'openWorkerBrood' as const },
  { id: 'droneBrood' as const },
  { id: 'pollen' as const },
  { id: 'feed' as const },
];

type ContentFieldId = (typeof CONTENT_FIELDS)[number]['id'];
type ContentCounts = Record<ContentFieldId, number>;

const EMPTY_CONTENT: ContentCounts = {
  bees: 0,
  cappedWorkerBrood: 0,
  openWorkerBrood: 0,
  droneBrood: 0,
  pollen: 0,
  feed: 0,
};

// Seasonal evaluation thresholds (Dr. Pia Aumeier).
const EVALUATION_CONTEXTS = [
  {
    id: 'split_mid_may',
    kind: 'split' as const,
    minBees: 1000,
    minCappedBrood: 4000,
    minOpenBrood: 200,
  },
  {
    id: 'split_end_may',
    kind: 'split' as const,
    minBees: 2000,
    minCappedBrood: 6000,
    minOpenBrood: 200,
  },
  {
    id: 'split_mid_june',
    kind: 'split' as const,
    minBees: 3000,
    minCappedBrood: 9000,
    minOpenBrood: 200,
  },
  {
    id: 'winter_aug',
    kind: 'winter_aug' as const,
  },
  {
    id: 'winter_oct',
    kind: 'winter_oct' as const,
  },
];

type EvaluationId = (typeof EVALUATION_CONTEXTS)[number]['id'];

function Counter({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        disabled={value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
        aria-label="Decrease"
      >
        <Minus className="h-3 w-3" />
      </Button>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={e =>
          onChange(Math.max(0, Math.round(Number(e.target.value) || 0)))
        }
        className="h-8 w-16 text-center text-base font-semibold tabular-nums"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => onChange(value + 1)}
        aria-label="Increase"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-red-500" />
      )}
      <span className={ok ? '' : 'text-red-700 dark:text-red-400'}>{label}</span>
    </div>
  );
}

function formatGrams(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${Math.round(grams)} g`;
}

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Liebefelder Colony Strength Calculator',
      url: 'https://hivepal.app/tools/liebefelder',
      applicationCategory: 'UtilitiesApplication',
      applicationSubCategory: 'Beekeeping Calculator',
      operatingSystem: 'Web',
      browserRequirements: 'Requires JavaScript',
      description:
        'Free Liebefelder Schätzmethode calculator. Estimate bee population, brood cells, pollen and feed stores by counting comb eighths, with seasonal evaluation guidelines by Dr. Pia Aumeier.',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: {
        '@type': 'Organization',
        name: 'Hive Pal',
        url: 'https://hivepal.app',
      },
    },
  ],
};

export function LiebefelderPage() {
  const { t } = useTranslation('common');
  const [frameType, setFrameType] = useState<FrameTypeId>('zander');
  const [customPer, setCustomPer] = useState<PerEighth>(
    FRAME_TYPES[0].perEighth,
  );
  const [content, setContent] = useState<ContentCounts>(EMPTY_CONTENT);
  const [evaluationId, setEvaluationId] = useState<EvaluationId | null>(null);

  const selected = FRAME_TYPES.find(f => f.id === frameType) ?? null;
  const per = selected ? selected.perEighth : customPer;
  const frameLabel = selected
    ? selected.label
    : t('liebefelder.frameType.custom');

  const results = useMemo(() => {
    const bees = Math.round(content.bees * per.bees);
    const cappedBroodCells = Math.round(content.cappedWorkerBrood * per.workerBroodCells);
    const openBroodCells = Math.round(content.openWorkerBrood * per.workerBroodCells);
    const droneBroodCells = Math.round(content.droneBrood * per.droneBroodCells);
    return {
      beeEighths: content.bees,
      bees,
      // Rule of thumb (Aumeier): ~1,000 bees fill one Wabengasse (frame gap).
      wabengassen: bees / 1000,
      cappedBroodCells,
      openBroodCells,
      droneBroodCells,
      pollenGrams: content.pollen * per.pollenG,
      feedGrams: content.feed * per.feedG,
    };
  }, [content, per]);

  const hasBees = results.beeEighths > 0;
  const hasBrood =
    results.cappedBroodCells > 0 ||
    results.openBroodCells > 0 ||
    results.droneBroodCells > 0;
  const hasStores = results.pollenGrams > 0 || results.feedGrams > 0;
  const hasAnyResult = hasBees || hasBrood || hasStores;

  const evaluation = EVALUATION_CONTEXTS.find(e => e.id === evaluationId) ?? null;

  const setContentCount = (field: ContentFieldId) => (value: number) =>
    setContent(prev => ({ ...prev, [field]: value }));

  const setCustomValue =
    (field: keyof PerEighth) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setCustomPer(prev => ({
        ...prev,
        [field]: Math.max(0, Number(e.target.value) || 0),
      }));

  const renderEvaluation = () => {
    if (!evaluation) return null;

    if (evaluation.kind === 'split') {
      return (
        <div className="space-y-1.5">
          <CheckRow
            ok={results.bees >= evaluation.minBees}
            label={t('liebefelder.evaluation.checks.minBees', {
              min: evaluation.minBees.toLocaleString(),
              measured: results.bees.toLocaleString(),
            })}
          />
          <CheckRow
            ok={results.cappedBroodCells >= evaluation.minCappedBrood}
            label={t('liebefelder.evaluation.checks.minCappedBrood', {
              min: evaluation.minCappedBrood.toLocaleString(),
              measured: results.cappedBroodCells.toLocaleString(),
            })}
          />
          <CheckRow
            ok={results.openBroodCells >= evaluation.minOpenBrood}
            label={t('liebefelder.evaluation.checks.minOpenBrood', {
              min: evaluation.minOpenBrood.toLocaleString(),
              measured: results.openBroodCells.toLocaleString(),
            })}
          />
          <p className="pt-1 text-xs text-muted-foreground">
            {t('liebefelder.evaluation.splitNote')}
          </p>
        </div>
      );
    }

    if (evaluation.kind === 'winter_aug') {
      const ok = results.bees > 15000;
      return (
        <div className="space-y-1.5">
          <CheckRow
            ok={ok}
            label={t('liebefelder.evaluation.winterAug.check', {
              measured: results.bees.toLocaleString(),
            })}
          />
          <p className="pt-1 text-xs text-muted-foreground">
            {t('liebefelder.evaluation.winterAug.note')}
          </p>
        </div>
      );
    }

    // winter_oct: classify by occupied Wabengassen after a cold night.
    const gassen = Math.round(results.wabengassen);
    const values = { bees: results.bees.toLocaleString(), gassen };
    let verdict: { icon: React.ReactNode; text: string; className: string };
    if (gassen >= 5) {
      verdict = {
        icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />,
        text: t('liebefelder.evaluation.winterOct.ready', values),
        className: 'text-green-700 dark:text-green-400',
      };
    } else if (gassen === 4) {
      verdict = {
        icon: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />,
        text: t('liebefelder.evaluation.winterOct.minimal', values),
        className: 'text-amber-700 dark:text-amber-400',
      };
    } else {
      verdict = {
        icon: <XCircle className="h-4 w-4 shrink-0 text-red-500" />,
        text: t('liebefelder.evaluation.winterOct.atRisk', values),
        className: 'text-red-700 dark:text-red-400',
      };
    }
    return (
      <div className="space-y-1.5">
        <div className="flex items-start gap-2 text-sm">
          {verdict.icon}
          <span className={verdict.className}>{verdict.text}</span>
        </div>
        <p className="pt-1 text-xs text-muted-foreground">
          {t('liebefelder.evaluation.winterOct.note')}
        </p>
      </div>
    );
  };

  return (
    <PageGrid>
      <ToolMeta
        title="Liebefelder Colony Strength Calculator — Hive Pal"
        description="Free Liebefelder Schätzmethode calculator. Estimate bee population, brood cells, pollen and feed stores by counting comb eighths — with seasonal evaluation guidelines by Dr. Pia Aumeier."
        ogDescription="Estimate colony strength with the Liebefelder Schätzmethode: bees, brood, pollen and feed from 1/8 comb counts, plus seasonal strength evaluation."
        path="/tools/liebefelder"
        structuredData={structuredData}
      />

      <MainContent>
        <ToolPageHeader
          title={t('liebefelder.title')}
          description={t('liebefelder.description')}
          intro={t('liebefelder.intro')}
        />

        {/* Frame type */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bug className="h-5 w-5" />
              {t('liebefelder.frameType.title')}
            </CardTitle>
            <CardDescription>
              {t('liebefelder.frameType.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {FRAME_TYPES.map(f => (
                <Pill
                  key={f.id}
                  active={frameType === f.id}
                  onClick={() => setFrameType(f.id)}
                >
                  {f.label}
                  <span className="ml-1 text-xs opacity-60">({f.dimensions})</span>
                </Pill>
              ))}
              <Pill
                active={frameType === 'custom'}
                onClick={() => setFrameType('custom')}
              >
                {t('liebefelder.frameType.custom')}
              </Pill>
            </div>

            {frameType === 'custom' && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  {t('liebefelder.frameType.customDescription')}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {PER_EIGHTH_FIELDS.map(field => (
                    <div key={field.id} className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {t(`liebefelder.reference.${field.id}`)}
                        {field.unit && ` (${field.unit})`}
                      </p>
                      <Input
                        type="number"
                        min={0}
                        value={customPer[field.id]}
                        onChange={setCustomValue(field.id)}
                        className="h-8 tabular-nums"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Counts: bees, brood and stores as total eighths */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">
              {t('liebefelder.counts.title')}
            </CardTitle>
            <CardDescription>
              {t('liebefelder.counts.description', {
                bees: per.bees,
                frame: frameLabel,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {CONTENT_FIELDS.map(field => (
                <div
                  key={field.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {t(`liebefelder.fields.${field.id}`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(`liebefelder.fields.${field.id}Hint`)}
                    </p>
                  </div>
                  <Counter
                    value={content[field.id]}
                    onChange={setContentCount(field.id)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className={`mb-4 ${hasAnyResult ? '' : 'opacity-60'}`}>
          <CardHeader>
            <CardTitle className="text-base">
              {t('liebefelder.result.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasAnyResult ? (
              <p className="text-sm text-muted-foreground">
                {t('liebefelder.result.empty')}
              </p>
            ) : (
              <div className="space-y-4">
                {hasBees && (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                      <p className="text-xs text-muted-foreground">
                        {t('liebefelder.result.bees')}
                      </p>
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                        ~{results.bees.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        {t('liebefelder.result.wabengassen')}
                      </p>
                      <p className="text-2xl font-bold">
                        {results.wabengassen.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('liebefelder.result.wabengassenNote')}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        {t('liebefelder.result.strengthField')}
                      </p>
                      <p className="text-2xl font-bold">
                        {Math.round(results.wabengassen)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('liebefelder.result.strengthFieldNote')}
                      </p>
                    </div>
                  </div>
                )}

                {hasBrood && (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        {t('liebefelder.result.cappedBrood')}
                      </p>
                      <p className="text-xl font-bold">
                        ~{results.cappedBroodCells.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('liebefelder.result.cells')}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        {t('liebefelder.result.openBrood')}
                      </p>
                      <p className="text-xl font-bold">
                        ~{results.openBroodCells.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('liebefelder.result.cells')}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        {t('liebefelder.result.droneBrood')}
                      </p>
                      <p className="text-xl font-bold">
                        ~{results.droneBroodCells.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('liebefelder.result.cells')}
                      </p>
                    </div>
                  </div>
                )}

                {results.cappedBroodCells > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t('liebefelder.result.emergeNote', {
                      cells: results.cappedBroodCells.toLocaleString(),
                      gassen: (results.cappedBroodCells / 1000).toFixed(1),
                    })}
                  </p>
                )}

                {hasStores && (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        {t('liebefelder.result.pollen')}
                      </p>
                      <p className="text-xl font-bold">
                        ~{formatGrams(results.pollenGrams)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        {t('liebefelder.result.feed')}
                      </p>
                      <p className="text-xl font-bold">
                        ~{formatGrams(results.feedGrams)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seasonal evaluation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-5 w-5" />
              {t('liebefelder.evaluation.title')}
            </CardTitle>
            <CardDescription>
              {t('liebefelder.evaluation.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-2">
              {EVALUATION_CONTEXTS.map(ctx => (
                <Pill
                  key={ctx.id}
                  active={evaluationId === ctx.id}
                  onClick={() =>
                    setEvaluationId(evaluationId === ctx.id ? null : ctx.id)
                  }
                >
                  {t(`liebefelder.evaluation.contexts.${ctx.id}`)}
                </Pill>
              ))}
            </div>

            {!evaluation && (
              <p className="text-sm text-muted-foreground">
                {t('liebefelder.evaluation.selectPrompt')}
              </p>
            )}

            {evaluation && !hasAnyResult && (
              <p className="text-sm text-muted-foreground">
                {t('liebefelder.evaluation.enterCountsFirst')}
              </p>
            )}

            {evaluation && hasAnyResult && renderEvaluation()}
          </CardContent>
        </Card>
      </MainContent>

      <PageAside>
        {/* Per-eighth reference for selected frame type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('liebefelder.reference.title', { frame: frameLabel })}
            </CardTitle>
            <CardDescription>{t('liebefelder.source')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t('liebefelder.reference.bees')}</span><span className="font-medium">{per.bees}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('liebefelder.reference.drones')}</span><span className="font-medium">{per.drones}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('liebefelder.reference.workerBroodCells')}</span><span className="font-medium">{t('liebefelder.reference.cellsValue', { value: per.workerBroodCells })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('liebefelder.reference.droneBroodCells')}</span><span className="font-medium">{t('liebefelder.reference.cellsValue', { value: per.droneBroodCells })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('liebefelder.reference.pollenG')}</span><span className="font-medium">{per.pollenG} g</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('liebefelder.reference.feedG')}</span><span className="font-medium">{per.feedG} g</span></div>
            </div>
          </CardContent>
        </Card>

        <TipsCard
          className="mt-4"
          icon={<Lightbulb className="h-5 w-5" />}
          title={t('liebefelder.tips.coverage.title')}
          items={[
            {
              title: t('liebefelder.tips.coverage.pullFrames.title'),
              description: t('liebefelder.tips.coverage.pullFrames.description'),
            },
            {
              title: t('liebefelder.tips.coverage.bothSides.title'),
              description: t('liebefelder.tips.coverage.bothSides.description'),
            },
            {
              title: t('liebefelder.tips.coverage.roundDown.title'),
              description: t('liebefelder.tips.coverage.roundDown.description'),
            },
          ]}
        />

        <TipsCard
          className="mt-4"
          title={t('liebefelder.tips.emergence.title')}
          description={t('liebefelder.source')}
          items={[
            {
              title: t('liebefelder.tips.emergence.capped.title'),
              description: t('liebefelder.tips.emergence.capped.description'),
            },
            {
              title: t('liebefelder.tips.emergence.open.title'),
              description: t('liebefelder.tips.emergence.open.description'),
            },
            {
              title: t('liebefelder.tips.emergence.drone.title'),
              description: t('liebefelder.tips.emergence.drone.description'),
            },
            {
              title: t('liebefelder.tips.emergence.ruleOfThumb.title'),
              description: t('liebefelder.tips.emergence.ruleOfThumb.description'),
            },
          ]}
        />

        <TipsCard
          className="mt-4"
          title={t('liebefelder.tips.feed.title')}
          description={t('liebefelder.source')}
          items={[
            {
              title: t('liebefelder.tips.feed.yearRound.title'),
              description: t('liebefelder.tips.feed.yearRound.description'),
            },
            {
              title: t('liebefelder.tips.feed.warmRegion.title'),
              description: t('liebefelder.tips.feed.warmRegion.description'),
            },
            {
              title: t('liebefelder.tips.feed.coolRegion.title'),
              description: t('liebefelder.tips.feed.coolRegion.description'),
            },
            {
              title: t('liebefelder.tips.feed.spring.title'),
              description: t('liebefelder.tips.feed.spring.description'),
            },
          ]}
        />

        <TipsCard
          className="mt-4"
          title={t('liebefelder.tips.development.title')}
          description={t('liebefelder.source')}
          items={[
            {
              title: t('liebefelder.tips.development.queen.title'),
              description: t('liebefelder.tips.development.queen.description'),
            },
            {
              title: t('liebefelder.tips.development.worker.title'),
              description: t('liebefelder.tips.development.worker.description'),
            },
            {
              title: t('liebefelder.tips.development.drone.title'),
              description: t('liebefelder.tips.development.drone.description'),
            },
          ]}
        />
      </PageAside>
    </PageGrid>
  );
}
