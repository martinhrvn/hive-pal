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
import { Pill } from '@/components/common/pill';
import { ToolMeta, ToolPageHeader, TipsCard } from '@/components/tool-page';

const SOURCE_ATTRIBUTION = 'Source: Dr. Pia Aumeier, Germany';

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

type FrameTypeId = (typeof FRAME_TYPES)[number]['id'];

// Bee coverage is entered per side in eighths (8/8 = fully covered side).
const COVERAGE_LEVELS = [
  { id: 'e8' as const, label: '8/8', note: 'fully covered', eighths: 8 },
  { id: 'e7' as const, label: '7/8', note: '', eighths: 7 },
  { id: 'e6' as const, label: '6/8', note: '', eighths: 6 },
  { id: 'e5' as const, label: '5/8', note: '', eighths: 5 },
  { id: 'e4' as const, label: '4/8', note: 'half', eighths: 4 },
  { id: 'e3' as const, label: '3/8', note: '', eighths: 3 },
  { id: 'e2' as const, label: '2/8', note: '', eighths: 2 },
  { id: 'e1' as const, label: '1/8', note: 'nearly empty', eighths: 1 },
];

type CoverageId = (typeof COVERAGE_LEVELS)[number]['id'];
type CoverageCounts = Record<CoverageId, number>;

const EMPTY_COVERAGE: CoverageCounts = {
  e8: 0, e7: 0, e6: 0, e5: 0, e4: 0, e3: 0, e2: 0, e1: 0,
};

// Brood and stores are counted directly as total eighths across all combs.
const CONTENT_FIELDS = [
  { id: 'cappedWorkerBrood' as const, label: 'Capped worker brood', hint: 'emerges within 0–12 days' },
  { id: 'openWorkerBrood' as const, label: 'Open worker brood', hint: 'emerges within 13–21 days' },
  { id: 'droneBrood' as const, label: 'Drone brood', hint: 'capped 0–14 d, open 15–24 d' },
  { id: 'pollen' as const, label: 'Pollen', hint: 'stored bee bread' },
  { id: 'feed' as const, label: 'Feed / honey', hint: 'capped or open stores' },
];

type ContentFieldId = (typeof CONTENT_FIELDS)[number]['id'];
type ContentCounts = Record<ContentFieldId, number>;

const EMPTY_CONTENT: ContentCounts = {
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
    label: 'Split by mid-May',
    kind: 'split' as const,
    minBees: 1000,
    minCappedBrood: 4000,
    minOpenBrood: 200,
  },
  {
    id: 'split_end_may',
    label: 'Split by end of May',
    kind: 'split' as const,
    minBees: 2000,
    minCappedBrood: 6000,
    minOpenBrood: 200,
  },
  {
    id: 'split_mid_june',
    label: 'Split by mid-June',
    kind: 'split' as const,
    minBees: 3000,
    minCappedBrood: 9000,
    minOpenBrood: 200,
  },
  {
    id: 'winter_aug',
    label: 'Wintering, mid-August',
    kind: 'winter_aug' as const,
  },
  {
    id: 'winter_oct',
    label: 'Wintering, end of October',
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
      <span className="w-8 text-center text-base font-semibold tabular-nums">
        {value}
      </span>
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
  const [frameType, setFrameType] = useState<FrameTypeId>('zander');
  const [coverage, setCoverage] = useState<CoverageCounts>(EMPTY_COVERAGE);
  const [content, setContent] = useState<ContentCounts>(EMPTY_CONTENT);
  const [evaluationId, setEvaluationId] = useState<EvaluationId | null>(null);

  const selected = FRAME_TYPES.find(f => f.id === frameType)!;
  const per = selected.perEighth;

  const results = useMemo(() => {
    const beeEighths = COVERAGE_LEVELS.reduce(
      (sum, level) => sum + coverage[level.id] * level.eighths,
      0,
    );
    const bees = Math.round(beeEighths * per.bees);
    const cappedBroodCells = Math.round(content.cappedWorkerBrood * per.workerBroodCells);
    const openBroodCells = Math.round(content.openWorkerBrood * per.workerBroodCells);
    const droneBroodCells = Math.round(content.droneBrood * per.droneBroodCells);
    return {
      beeEighths,
      bees,
      // Rule of thumb (Aumeier): ~1,000 bees fill one Wabengasse (frame gap).
      wabengassen: bees / 1000,
      cappedBroodCells,
      openBroodCells,
      droneBroodCells,
      pollenGrams: content.pollen * per.pollenG,
      feedGrams: content.feed * per.feedG,
    };
  }, [coverage, content, per]);

  const hasBees = results.beeEighths > 0;
  const hasBrood =
    results.cappedBroodCells > 0 ||
    results.openBroodCells > 0 ||
    results.droneBroodCells > 0;
  const hasStores = results.pollenGrams > 0 || results.feedGrams > 0;
  const hasAnyResult = hasBees || hasBrood || hasStores;

  const evaluation = EVALUATION_CONTEXTS.find(e => e.id === evaluationId) ?? null;

  const setCoverageCount = (level: CoverageId) => (value: number) =>
    setCoverage(prev => ({ ...prev, [level]: value }));

  const setContentCount = (field: ContentFieldId) => (value: number) =>
    setContent(prev => ({ ...prev, [field]: value }));

  const renderEvaluation = () => {
    if (!evaluation) return null;

    if (evaluation.kind === 'split') {
      return (
        <div className="space-y-1.5">
          <CheckRow
            ok={results.bees >= evaluation.minBees}
            label={`≥ ${evaluation.minBees.toLocaleString()} bees (measured: ~${results.bees.toLocaleString()})`}
          />
          <CheckRow
            ok={results.cappedBroodCells >= evaluation.minCappedBrood}
            label={`≥ ${evaluation.minCappedBrood.toLocaleString()} capped worker brood cells (measured: ~${results.cappedBroodCells.toLocaleString()})`}
          />
          <CheckRow
            ok={results.openBroodCells >= evaluation.minOpenBrood}
            label={`≥ ${evaluation.minOpenBrood.toLocaleString()} open worker brood cells (measured: ~${results.openBroodCells.toLocaleString()})`}
          />
          <p className="pt-1 text-xs text-muted-foreground">
            A broodless mating split (Begattungsableger) created by mid-May needs only ≥ 1,000 bees and no brood.
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
            label={`> 15,000 bees regardless of brood (measured: ~${results.bees.toLocaleString()})`}
          />
          <p className="pt-1 text-xs text-muted-foreground">
            Applies to established colonies in mid-August: a colony this strong hangs through into the floor across more than 5 Wabengassen. Weaker, shrinking colonies and this year's splits are assessed at the end of October instead.
          </p>
        </div>
      );
    }

    // winter_oct: classify by occupied Wabengassen after a cold night.
    const gassen = Math.round(results.wabengassen);
    let verdict: { icon: React.ReactNode; text: string; className: string };
    if (gassen >= 5) {
      verdict = {
        icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />,
        text: `Ready for winter — ~${results.bees.toLocaleString()} bees on ${gassen} Wabengassen (5 or more occupied gaps; over 5,000 bees).`,
        className: 'text-green-700 dark:text-green-400',
      };
    } else if (gassen === 4) {
      verdict = {
        icon: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />,
        text: `Minimal wintering strength — ~${results.bees.toLocaleString()} bees on 4 Wabengassen (around 5,000 bees).`,
        className: 'text-amber-700 dark:text-amber-400',
      };
    } else {
      verdict = {
        icon: <XCircle className="h-4 w-4 shrink-0 text-red-500" />,
        text: `Strongly at risk of winter loss — ~${results.bees.toLocaleString()} bees on ${gassen} Wabengassen (3 or fewer occupied gaps; under 5,000 bees). Combine or dissolve.`,
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
          Assess as late as possible, after a cold night (≈ 5 °C), by counting the Wabengassen occupied by bees.
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
          title="Liebefelder Schätzmethode"
          description="Colony strength estimator"
          intro="The Liebefelder method estimates colony strength by assessing each comb side in eighths (1/8 steps): how much is covered with bees, brood, pollen, and feed. Estimation values and seasonal guidelines are based on the population-estimation cheat sheet by Dr. Pia Aumeier, Germany."
        />

        {/* Frame type */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bug className="h-5 w-5" />
              Frame type
            </CardTitle>
            <CardDescription>
              Choose the frame format used in your hive — it determines the estimation values per eighth.
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
            </div>
          </CardContent>
        </Card>

        {/* Bee coverage */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Bees — coverage per side</CardTitle>
            <CardDescription>
              For each comb side, estimate in eighths how much is covered with a layer of bees, and count the sides per coverage level. One eighth holds about {per.bees} bees ({selected.label}).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {COVERAGE_LEVELS.map(level => (
                <div
                  key={level.id}
                  className="flex flex-col items-center gap-2 rounded-lg border bg-muted/30 p-3"
                >
                  <p className="text-sm font-semibold">{level.label}</p>
                  {level.note && (
                    <p className="text-xs text-muted-foreground">{level.note}</p>
                  )}
                  <Counter
                    value={coverage[level.id]}
                    onChange={setCoverageCount(level.id)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Brood and stores */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Brood &amp; stores — total eighths (optional)</CardTitle>
            <CardDescription>
              Sum the eighths of comb area across all combs for each category. Needed for split evaluation and feed assessment.
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
                    <p className="text-sm font-medium">{field.label}</p>
                    <p className="text-xs text-muted-foreground">{field.hint}</p>
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
            <CardTitle className="text-base">Result</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasAnyResult ? (
              <p className="text-sm text-muted-foreground">
                Enter your eighth counts above to see the estimate.
              </p>
            ) : (
              <div className="space-y-4">
                {hasBees && (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                      <p className="text-xs text-muted-foreground">Bees</p>
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                        ~{results.bees.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Wabengassen</p>
                      <p className="text-2xl font-bold">
                        {results.wabengassen.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">≈ 1,000 bees each</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Strength field</p>
                      <p className="text-2xl font-bold">
                        {Math.round(results.wabengassen)}
                      </p>
                      <p className="text-xs text-muted-foreground">for inspection</p>
                    </div>
                  </div>
                )}

                {hasBrood && (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Capped worker brood</p>
                      <p className="text-xl font-bold">
                        ~{results.cappedBroodCells.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">cells</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Open worker brood</p>
                      <p className="text-xl font-bold">
                        ~{results.openBroodCells.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">cells</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Drone brood</p>
                      <p className="text-xl font-bold">
                        ~{results.droneBroodCells.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">cells</p>
                    </div>
                  </div>
                )}

                {results.cappedBroodCells > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Within the next 12 days, ~{results.cappedBroodCells.toLocaleString()} bees will emerge from the capped worker brood — roughly{' '}
                    {(results.cappedBroodCells / 1000).toFixed(1)} additional Wabengassen. Expand the hive in time.
                  </p>
                )}

                {hasStores && (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Pollen</p>
                      <p className="text-xl font-bold">
                        ~{formatGrams(results.pollenGrams)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Feed / honey</p>
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
              Seasonal evaluation
            </CardTitle>
            <CardDescription>
              Compare the measured colony against the seasonal benchmarks by Dr. Pia Aumeier, Germany.
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
                  {ctx.label}
                </Pill>
              ))}
            </div>

            {!evaluation && (
              <p className="text-sm text-muted-foreground">
                Select a context to evaluate the colony.
              </p>
            )}

            {evaluation && !hasAnyResult && (
              <p className="text-sm text-muted-foreground">
                Enter your counts above first.
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
              One eighth of a {selected.label} comb side contains…
            </CardTitle>
            <CardDescription>{SOURCE_ATTRIBUTION}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Bees</span><span className="font-medium">{per.bees}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Drones</span><span className="font-medium">{per.drones}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Worker brood (capped/open)</span><span className="font-medium">{per.workerBroodCells} cells</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Drone brood (capped/open)</span><span className="font-medium">{per.droneBroodCells} cells</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pollen</span><span className="font-medium">{per.pollenG} g</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Feed / honey</span><span className="font-medium">{per.feedG} g</span></div>
            </div>
          </CardContent>
        </Card>

        <TipsCard
          className="mt-4"
          icon={<Lightbulb className="h-5 w-5" />}
          title="How to assess coverage"
          items={[
            {
              title: 'Pull out each frame',
              description:
                'Remove one frame at a time. Look straight at each side and estimate in eighths how much of the comb surface is covered with bees, brood, pollen, or feed.',
            },
            {
              title: 'Count both sides independently',
              description:
                'Each frame has two sides. A frame fully covered with bees on both sides contributes two 8/8 entries.',
            },
            {
              title: 'Round down when in doubt',
              description:
                'Underestimating is safer than overestimating — round to the nearest lower eighth.',
            },
          ]}
        />

        <TipsCard
          className="mt-4"
          title="When does the brood emerge?"
          description={SOURCE_ATTRIBUTION}
          items={[
            {
              title: 'Capped worker brood',
              description: 'All currently capped worker cells emerge within 0–12 days.',
            },
            {
              title: 'Open worker brood',
              description: 'Open worker cells emerge within 13–21 days.',
            },
            {
              title: 'Drone brood',
              description: 'Capped drone cells emerge within 0–14 days, open drone cells within 15–24 days.',
            },
            {
              title: 'Rule of thumb',
              description: 'About 1,000 emerged bees fill one Wabengasse — expand the hive before the colony outgrows it.',
            },
          ]}
        />

        <TipsCard
          className="mt-4"
          title="Required feed stores"
          description={SOURCE_ATTRIBUTION}
          items={[
            {
              title: 'Throughout the year',
              description: 'At least 1 kg of feed at all times — for production colonies and splits alike.',
            },
            {
              title: 'Wintering, warm region (e.g. NRW)',
              description:
                'Production colonies: 13 kg pure sugar = 18 kg / 13 L syrup ≈ 8 full Zander combs. Splits: 10 kg sugar = 14 kg / 10 L syrup ≈ 6 full Zander combs.',
            },
            {
              title: 'Wintering, cool region (e.g. BW, Bavaria)',
              description:
                'Production colonies: 20 kg pure sugar = 28 kg / 20 L syrup ≈ 12 full Zander combs. Splits: 15 kg sugar = 21 kg / 15 L syrup ≈ 9 full Zander combs.',
            },
            {
              title: 'Before the spring flow (Feb–Mar)',
              description: 'In a wet, cold early spring: at least 10 kg of feed remaining.',
            },
          ]}
        />

        <TipsCard
          className="mt-4"
          title="Development times until emergence"
          description={SOURCE_ATTRIBUTION}
          items={[
            {
              title: 'Queen — 16 days',
              description:
                'From the egg (swarm or silent supersedure): 3 d egg + 5 d larva + 8 d pupa. Emergency cells started from a ~2-day-old larva emerge after just 11 days. One queen per colony.',
            },
            {
              title: 'Worker — 21 days',
              description:
                'From the fertilized egg: 3 d egg + 6 d larva + 12 d pupa. A colony holds 5,000–40,000 workers.',
            },
            {
              title: 'Drone — 24 days',
              description:
                'From the unfertilized egg: 3 d egg + 7 d larva + 14 d pupa. A colony holds 0–1,000 drones.',
            },
          ]}
        />
      </PageAside>
    </PageGrid>
  );
}
