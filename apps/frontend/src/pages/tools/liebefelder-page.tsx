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
import type { TFunction } from 'i18next';
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

type PerEighth = {
  bees: number;
  drones: number;
  workerBroodCells: number;
  droneBroodCells: number;
  pollenG: number;
  feedG: number;
};

type FrameDimensions = {
  widthMm: number;
  heightMm: number;
};

type FrameTypeConfig = {
  id: string;
  label: string;
  dimensions: string;
  dimensionsMm: FrameDimensions;
  perEighth: PerEighth;
};

const ZANDER_DIMENSIONS: FrameDimensions = { widthMm: 420, heightMm: 220 };
const ZANDER_PER_EIGHTH: PerEighth = {
  bees: 125,
  drones: 100,
  workerBroodCells: 400,
  droneBroodCells: 230,
  pollenG: 40,
  feedG: 125,
};

function formatFrameDimensions(dimensions: FrameDimensions): string {
  return `${dimensions.widthMm}×${dimensions.heightMm} mm`;
}

function calculateFromZanderArea(dimensions: FrameDimensions): PerEighth {
  const zanderArea = ZANDER_DIMENSIONS.widthMm * ZANDER_DIMENSIONS.heightMm;
  const frameArea = Math.max(0, dimensions.widthMm * dimensions.heightMm);
  const scale = zanderArea > 0 ? frameArea / zanderArea : 1;

  return {
    bees: Math.round(ZANDER_PER_EIGHTH.bees * scale),
    drones: Math.round(ZANDER_PER_EIGHTH.drones * scale),
    workerBroodCells: Math.round(
      ZANDER_PER_EIGHTH.workerBroodCells * scale,
    ),
    droneBroodCells: Math.round(ZANDER_PER_EIGHTH.droneBroodCells * scale),
    pollenG: Math.round(ZANDER_PER_EIGHTH.pollenG * scale),
    feedG: Math.round(ZANDER_PER_EIGHTH.feedG * scale),
  };
}

// Estimation values per 1/8 of a comb side, from Dr. Pia Aumeier's
// population-estimation cheat sheet ("Durchzählen bitte!"). Custom frames are
// calculated from the Zander values by scaling with comb-side frame area.
const FRAME_TYPES = [
  {
    id: 'zander',
    label: 'Zander',
    dimensions: formatFrameDimensions(ZANDER_DIMENSIONS),
    dimensionsMm: ZANDER_DIMENSIONS,
    perEighth: ZANDER_PER_EIGHTH,
  },
  {
    id: 'dnm',
    label: 'Deutsch-Normal',
    dimensions: '370×223 mm',
    dimensionsMm: { widthMm: 370, heightMm: 223 },
    perEighth: calculateFromZanderArea({ widthMm: 370, heightMm: 223 }),
  },
  {
    id: 'langstroth',
    label: 'Langstroth',
    dimensions: '448×232 mm',
    dimensionsMm: { widthMm: 448, heightMm: 232 },
    perEighth: calculateFromZanderArea({ widthMm: 448, heightMm: 232 }),
  },
  {
    id: 'dadant',
    label: 'Dadant',
    dimensions: '448×285 mm',
    dimensionsMm: { widthMm: 448, heightMm: 285 },
    perEighth: calculateFromZanderArea({ widthMm: 448, heightMm: 285 }),
  },
] as const satisfies readonly FrameTypeConfig[];

type FrameTypeId = (typeof FRAME_TYPES)[number]['id'] | 'custom';

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

type ResultStatCardProps = {
  label: string;
  value: React.ReactNode;
  note?: string;
  highlighted?: boolean;
  valueClassName?: string;
};

function ResultStatCard({
  label,
  value,
  note,
  highlighted = false,
  valueClassName = 'text-xl font-bold',
}: ResultStatCardProps) {
  return (
    <div
      className={
        highlighted
          ? 'rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30'
          : 'rounded-lg bg-muted/50 p-3'
      }
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={valueClassName}>{value}</p>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

function ResultStatGrid({
  columns,
  children,
}: {
  columns: 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid ${
        columns === 3 ? 'grid-cols-3' : 'grid-cols-2'
      } gap-3 text-center`}
    >
      {children}
    </div>
  );
}

function ReferenceRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

type TipSection = {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  icon?: 'lightbulb';
  itemKeys: readonly string[];
};

const TIP_SECTIONS: readonly TipSection[] = [
  {
    id: 'coverage',
    titleKey: 'liebefelder.tips.coverage.title',
    icon: 'lightbulb',
    itemKeys: [
      'liebefelder.tips.coverage.pullFrames',
      'liebefelder.tips.coverage.bothSides',
      'liebefelder.tips.coverage.roundDown',
    ],
  },
  {
    id: 'emergence',
    titleKey: 'liebefelder.tips.emergence.title',
    descriptionKey: 'liebefelder.source',
    itemKeys: [
      'liebefelder.tips.emergence.capped',
      'liebefelder.tips.emergence.open',
      'liebefelder.tips.emergence.drone',
      'liebefelder.tips.emergence.ruleOfThumb',
    ],
  },
  {
    id: 'feed',
    titleKey: 'liebefelder.tips.feed.title',
    descriptionKey: 'liebefelder.source',
    itemKeys: [
      'liebefelder.tips.feed.yearRound',
      'liebefelder.tips.feed.warmRegion',
      'liebefelder.tips.feed.coolRegion',
      'liebefelder.tips.feed.spring',
    ],
  },
  {
    id: 'development',
    titleKey: 'liebefelder.tips.development.title',
    descriptionKey: 'liebefelder.source',
    itemKeys: [
      'liebefelder.tips.development.queen',
      'liebefelder.tips.development.worker',
      'liebefelder.tips.development.drone',
    ],
  },
] as const;

const buildTipItems = (t: TFunction, itemKeys: readonly string[]) =>
  itemKeys.map(key => ({
    title: t(`${key}.title`),
    description: t(`${key}.description`),
  }));

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
  const [customDimensions, setCustomDimensions] =
    useState<FrameDimensions>(ZANDER_DIMENSIONS);
  const [content, setContent] = useState<ContentCounts>(EMPTY_CONTENT);
  const [evaluationId, setEvaluationId] = useState<EvaluationId | null>(null);

  const customPer = useMemo(
    () => calculateFromZanderArea(customDimensions),
    [customDimensions],
  );
  const selected = FRAME_TYPES.find(f => f.id === frameType) ?? null;
  const per = selected ? selected.perEighth : customPer;
  const frameLabel = selected
    ? selected.label
    : `${t('liebefelder.frameType.custom')} (${formatFrameDimensions(customDimensions)})`;
  const customAreaRatio =
    (customDimensions.widthMm * customDimensions.heightMm) /
    (ZANDER_DIMENSIONS.widthMm * ZANDER_DIMENSIONS.heightMm);

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

  const setCustomDimension =
    (field: keyof FrameDimensions) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setCustomDimensions(prev => ({
        ...prev,
        [field]: Math.max(1, Math.round(Number(e.target.value) || 1)),
      }));

  const renderEvaluation = () => {
    if (!evaluation) return null;

    if (evaluation.kind === 'split') {
      const checks = [
        {
          id: 'minBees',
          ok: results.bees >= evaluation.minBees,
          min: evaluation.minBees,
          measured: results.bees,
        },
        {
          id: 'minCappedBrood',
          ok: results.cappedBroodCells >= evaluation.minCappedBrood,
          min: evaluation.minCappedBrood,
          measured: results.cappedBroodCells,
        },
        {
          id: 'minOpenBrood',
          ok: results.openBroodCells >= evaluation.minOpenBrood,
          min: evaluation.minOpenBrood,
          measured: results.openBroodCells,
        },
      ];

      return (
        <div className="space-y-1.5">
          {checks.map(check => (
            <CheckRow
              key={check.id}
              ok={check.ok}
              label={t(`liebefelder.evaluation.checks.${check.id}`, {
                min: check.min.toLocaleString(),
                measured: check.measured.toLocaleString(),
              })}
            />
          ))}
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

  const beeResultCards = [
    {
      id: 'bees',
      label: t('liebefelder.result.bees'),
      value: `~${results.bees.toLocaleString()}`,
      highlighted: true,
      valueClassName: 'text-2xl font-bold text-amber-700 dark:text-amber-400',
    },
    {
      id: 'wabengassen',
      label: t('liebefelder.result.wabengassen'),
      value: results.wabengassen.toFixed(1),
      note: t('liebefelder.result.wabengassenNote'),
      valueClassName: 'text-2xl font-bold',
    },
    {
      id: 'strengthField',
      label: t('liebefelder.result.strengthField'),
      value: Math.round(results.wabengassen),
      note: t('liebefelder.result.strengthFieldNote'),
      valueClassName: 'text-2xl font-bold',
    },
  ];

  const broodResultCards = [
    {
      id: 'cappedBrood',
      label: t('liebefelder.result.cappedBrood'),
      value: `~${results.cappedBroodCells.toLocaleString()}`,
      note: t('liebefelder.result.cells'),
    },
    {
      id: 'openBrood',
      label: t('liebefelder.result.openBrood'),
      value: `~${results.openBroodCells.toLocaleString()}`,
      note: t('liebefelder.result.cells'),
    },
    {
      id: 'droneBrood',
      label: t('liebefelder.result.droneBrood'),
      value: `~${results.droneBroodCells.toLocaleString()}`,
      note: t('liebefelder.result.cells'),
    },
  ];

  const storeResultCards = [
    {
      id: 'pollen',
      label: t('liebefelder.result.pollen'),
      value: `~${formatGrams(results.pollenGrams)}`,
    },
    {
      id: 'feed',
      label: t('liebefelder.result.feed'),
      value: `~${formatGrams(results.feedGrams)}`,
    },
  ];

  const referenceRows = [
    { id: 'bees', value: per.bees },
    { id: 'drones', value: per.drones },
    {
      id: 'workerBroodCells',
      value: t('liebefelder.reference.cellsValue', {
        value: per.workerBroodCells,
      }),
    },
    {
      id: 'droneBroodCells',
      value: t('liebefelder.reference.cellsValue', {
        value: per.droneBroodCells,
      }),
    },
    { id: 'pollenG', value: `${per.pollenG} g` },
    { id: 'feedG', value: `${per.feedG} g` },
  ];

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
                  Enter the comb-side frame dimensions. Hive Pal derives bees,
                  drones, brood cells, pollen and feed per 1/8 from Zander by
                  scaling with frame area.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Width (mm)</p>
                    <Input
                      type="number"
                      min={1}
                      value={customDimensions.widthMm}
                      onChange={setCustomDimension('widthMm')}
                      className="h-8 tabular-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Height (mm)</p>
                    <Input
                      type="number"
                      min={1}
                      value={customDimensions.heightMm}
                      onChange={setCustomDimension('heightMm')}
                      className="h-8 tabular-nums"
                    />
                  </div>
                </div>
                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                  <p>
                    Derived from Zander ({formatFrameDimensions(ZANDER_DIMENSIONS)}) at{' '}
                    {customAreaRatio.toFixed(2)}× area. The calculated per-1/8
                    values are shown in the reference card.
                  </p>
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
                  <ResultStatGrid columns={3}>
                    {beeResultCards.map(card => (
                      <ResultStatCard key={card.id} {...card} />
                    ))}
                  </ResultStatGrid>
                )}

                {hasBrood && (
                  <ResultStatGrid columns={3}>
                    {broodResultCards.map(card => (
                      <ResultStatCard key={card.id} {...card} />
                    ))}
                  </ResultStatGrid>
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
                  <ResultStatGrid columns={2}>
                    {storeResultCards.map(card => (
                      <ResultStatCard key={card.id} {...card} />
                    ))}
                  </ResultStatGrid>
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
              {referenceRows.map(row => (
                <ReferenceRow
                  key={row.id}
                  label={t(`liebefelder.reference.${row.id}`)}
                  value={row.value}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {TIP_SECTIONS.map(section => (
          <TipsCard
            key={section.id}
            className="mt-4"
            icon={
              section.icon === 'lightbulb' ? (
                <Lightbulb className="h-5 w-5" />
              ) : undefined
            }
            title={t(section.titleKey)}
            description={
              section.descriptionKey ? t(section.descriptionKey) : undefined
            }
            items={buildTipItems(t, section.itemKeys)}
          />
        ))}

      </PageAside>
    </PageGrid>
  );
}
