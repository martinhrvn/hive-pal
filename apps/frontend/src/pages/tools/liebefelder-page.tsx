import { useState, useMemo } from 'react';
import { Lightbulb, Bug, Minus, Plus } from 'lucide-react';
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

const FRAME_TYPES = [
  { id: 'zander',     label: 'Zander',      dimensions: '420×220 mm', beesPerSide: 2500 },
  { id: 'dnm',        label: 'DNM / Normal', dimensions: '370×223 mm', beesPerSide: 2000 },
  { id: 'langstroth', label: 'Langstroth',   dimensions: '448×232 mm', beesPerSide: 2500 },
  { id: 'dadant',     label: 'Dadant',       dimensions: '448×285 mm', beesPerSide: 3000 },
  { id: 'segeberger', label: 'Segeberger',   dimensions: '495×223 mm', beesPerSide: 2800 },
  { id: 'other',      label: 'Other',        dimensions: '',           beesPerSide: 2000 },
] as const;

type FrameTypeId = (typeof FRAME_TYPES)[number]['id'];

const COVERAGE_LEVELS = [
  { id: 'e8' as const, label: '8/8', note: 'fully covered', fraction: 1.000 },
  { id: 'e7' as const, label: '7/8', note: '',               fraction: 0.875 },
  { id: 'e6' as const, label: '6/8', note: '',               fraction: 0.750 },
  { id: 'e5' as const, label: '5/8', note: '',               fraction: 0.625 },
  { id: 'e4' as const, label: '4/8', note: 'half',           fraction: 0.500 },
  { id: 'e3' as const, label: '3/8', note: '',               fraction: 0.375 },
  { id: 'e2' as const, label: '2/8', note: '',               fraction: 0.250 },
  { id: 'e1' as const, label: '1/8', note: 'nearly empty',   fraction: 0.125 },
];

type CoverageId = (typeof COVERAGE_LEVELS)[number]['id'];
type CoverageCounts = Record<CoverageId, number>;

const EMPTY_COUNTS: CoverageCounts = {
  e8: 0, e7: 0, e6: 0, e5: 0, e4: 0, e3: 0, e2: 0, e1: 0,
};

interface ColonyStrengthInfo {
  label: string;
  description: string;
  colorClass: string;
  bgClass: string;
}

function getColonyStrength(bees: number): ColonyStrengthInfo {
  if (bees < 10000) {
    return {
      label: 'Weak',
      description: 'The colony needs support. Check for queen issues and consider combining with another colony.',
      colorClass: 'text-red-700 dark:text-red-400',
      bgClass: 'bg-red-50 dark:bg-red-950/30',
    };
  }
  if (bees < 20000) {
    return {
      label: 'Average',
      description: 'A typical small-to-medium colony. Monitor for steady build-up.',
      colorClass: 'text-amber-700 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    };
  }
  if (bees < 40000) {
    return {
      label: 'Strong',
      description: 'A healthy, productive colony. Good conditions for a honey flow.',
      colorClass: 'text-green-700 dark:text-green-400',
      bgClass: 'bg-green-50 dark:bg-green-950/30',
    };
  }
  return {
    label: 'Very strong',
    description: 'An exceptionally large colony. Consider swarm prevention measures promptly.',
    colorClass: 'text-emerald-700 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
  };
}

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
      <span className="w-6 text-center text-base font-semibold tabular-nums">
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
        'Free Liebefelder Schätzmethode calculator. Estimate colony strength and bee population by counting covered frame sides in 1/8 increments.',
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
  const [counts, setCounts] = useState<CoverageCounts>(EMPTY_COUNTS);

  const selectedType = FRAME_TYPES.find(f => f.id === frameType)!;

  const { coveredSides, estimatedBees, occupiedSpaces } = useMemo(() => {
    const sides = COVERAGE_LEVELS.reduce(
      (sum, level) => sum + counts[level.id] * level.fraction,
      0,
    );
    return {
      coveredSides: sides,
      estimatedBees: Math.round(sides * selectedType.beesPerSide),
      occupiedSpaces: Math.round(sides / 2),
    };
  }, [counts, selectedType]);

  const hasResult = coveredSides > 0;
  const strengthInfo = hasResult ? getColonyStrength(estimatedBees) : null;

  const setCount = (level: CoverageId) => (value: number) =>
    setCounts(prev => ({ ...prev, [level]: value }));

  return (
    <PageGrid>
      <ToolMeta
        title="Liebefelder Colony Strength Calculator — Hive Pal"
        description="Free Liebefelder Schätzmethode calculator. Estimate your colony's bee population by counting covered frame sides in 1/8 increments. Works for all common frame sizes."
        ogDescription="Estimate colony strength with the Liebefelder Schätzmethode. Count covered frame sides (1/8 steps) and get an instant bee population estimate."
        path="/tools/liebefelder"
        structuredData={structuredData}
      />

      <MainContent>
        <ToolPageHeader
          title="Liebefelder Schätzmethode"
          description="Colony strength estimator"
          intro="The Liebefelder method, developed at the Swiss Bee Research Centre, estimates colony strength by counting how many frame sides are covered with bees. Each side is assessed in eighths (1/8 steps). Select your frame type, then enter how many sides fall into each of the eight coverage levels."
        />

        {/* Frame type */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bug className="h-5 w-5" />
              Frame type
            </CardTitle>
            <CardDescription>
              Choose the frame format used in your hive — this determines how many bees fit on a fully covered side.
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
                  {f.dimensions && (
                    <span className="ml-1 text-xs opacity-60">({f.dimensions})</span>
                  )}
                </Pill>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Approx.{' '}
              <strong>{selectedType.beesPerSide.toLocaleString()}</strong> bees
              per fully covered side for {selectedType.label}
            </p>
          </CardContent>
        </Card>

        {/* Coverage input */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Coverage count</CardTitle>
            <CardDescription>
              Pull out each frame and assess both sides. For each side, estimate what fraction (in eighths) of the comb surface is covered with a layer of bees.
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
                    value={counts[level.id]}
                    onChange={setCount(level.id)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className={hasResult ? '' : 'opacity-60'}>
          <CardHeader>
            <CardTitle className="text-base">Result</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasResult ? (
              <p className="text-sm text-muted-foreground">
                Enter your frame side counts above to see the estimate.
              </p>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Covered sides</p>
                    <p className="text-2xl font-bold">{coveredSides.toFixed(2)}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${strengthInfo!.bgClass}`}>
                    <p className="text-xs text-muted-foreground">Est. bees</p>
                    <p className={`text-2xl font-bold ${strengthInfo!.colorClass}`}>
                      ~{estimatedBees.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                    <p className="text-xs text-muted-foreground">Occupied spaces</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                      {occupiedSpaces}
                    </p>
                    <p className="text-xs text-muted-foreground">for inspection</p>
                  </div>
                </div>

                <div className={`rounded-lg border p-4 ${strengthInfo!.bgClass}`}>
                  <p className={`font-semibold ${strengthInfo!.colorClass}`}>
                    {strengthInfo!.label} colony
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {strengthInfo!.description}
                  </p>
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  <strong>Occupied spaces</strong> ({occupiedSpaces}) is the value to enter in the "Colony Strength" field of your inspection record — it represents how many inter-frame gaps are full of bees (≈ covered sides ÷ 2).
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </MainContent>

      <PageAside>
        <TipsCard
          icon={<Lightbulb className="h-5 w-5" />}
          title="How to assess coverage"
          items={[
            {
              title: 'Pull out each frame',
              description:
                'Remove one frame at a time. Look straight at each side and estimate how much of the comb surface is covered with a layer of bees.',
            },
            {
              title: 'Count both sides independently',
              description:
                'Each frame has two sides. A frame fully covered on both sides contributes two 8/8 entries. A frame with bees on one side only contributes one.',
            },
            {
              title: 'Use 1/8 increments',
              description:
                'Assess each side in eighths. When in doubt, round down to the nearest eighth — underestimating is safer than overestimating.',
            },
            {
              title: 'Occupied spaces vs. bee count',
              description:
                '"Occupied spaces" is the value used in the Colony Strength field of a Hive Pal inspection. It represents how many inter-frame gaps are full of bees, roughly covered sides ÷ 2.',
            },
          ]}
        />

        <TipsCard
          className="mt-4"
          title="Colony strength guidelines"
          items={[
            {
              title: 'Weak  (< 10 000 bees)',
              description:
                'Often caused by a failing or missing queen. Consider combining with a strong colony or re-queening.',
            },
            {
              title: 'Average  (10 000 – 20 000)',
              description:
                'Normal for early spring or after splits. Provide feeding if stores are low.',
            },
            {
              title: 'Strong  (20 000 – 40 000)',
              description:
                'Peak production colony. Add supers before it becomes honey-bound.',
            },
            {
              title: 'Very strong  (> 40 000)',
              description:
                'Swarm risk is high. Apply swarm-prevention measures promptly.',
            },
          ]}
        />
      </PageAside>
    </PageGrid>
  );
}
