import { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Beaker, Droplets, Ruler, Scale, Lightbulb, CookingPot } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Pill } from '@/components/common/pill';
import { useUnitFormat } from '@/hooks/use-unit-format';
import type { UnitPreference } from '@/utils/unit-conversion';

type Ratio = '1:1' | '3:2' | '2:1';

interface ContainerPreset {
  label: string;
  valueLiters: number;
}

const METRIC_CONTAINERS: ContainerPreset[] = [
  { label: '0.5 L', valueLiters: 0.5 },
  { label: '1 L', valueLiters: 1 },
  { label: '2 L', valueLiters: 2 },
  { label: '3 L', valueLiters: 3 },
  { label: '5 L', valueLiters: 5 },
  { label: '10 L', valueLiters: 10 },
];

const IMPERIAL_CONTAINERS: ContainerPreset[] = [
  { label: '1 qt', valueLiters: 0.946353 },
  { label: '2 qt', valueLiters: 1.892706 },
  { label: '1 gal', valueLiters: 3.78541 },
  { label: '2 gal', valueLiters: 7.57082 },
];

const RATIOS: { id: Ratio; sugar: number; water: number }[] = [
  { id: '1:1', sugar: 1, water: 1 },
  { id: '3:2', sugar: 3, water: 2 },
  { id: '2:1', sugar: 2, water: 1 },
];

// 1 gram of dissolved sucrose occupies ~0.63 mL of volume
const ML_PER_GRAM_SUGAR = 0.63;

function formatNum(value: number, decimals: number = 0): string {
  return value.toFixed(decimals).replace(/\.?0+$/, '') || '0';
}

/**
 * Calculate sugar syrup ingredients for a given container volume and ratio.
 *
 * For ratio S:W (sugar:water by weight), with W grams of water and S*W/W grams of sugar:
 *   totalVolumeML = waterML + sugarGrams * ML_PER_GRAM_SUGAR
 *   sugarGrams = waterGrams * (S/W)
 *   totalVolumeML = waterGrams + waterGrams * (S/W) * ML_PER_GRAM_SUGAR
 *   waterGrams = totalVolumeML / (1 + (S/W) * ML_PER_GRAM_SUGAR)
 */
function calculateSyrup(containerLiters: number, sugar: number, water: number) {
  const totalML = containerLiters * 1000;
  const ratio = sugar / water;
  const waterGrams = totalML / (1 + ratio * ML_PER_GRAM_SUGAR);
  const sugarGrams = waterGrams * ratio;
  const waterLiters = waterGrams / 1000;
  const totalGrams = waterGrams + sugarGrams;

  return { waterLiters, waterGrams, sugarGrams, totalGrams };
}

export function SyrupCalculatorPage() {
  const { t } = useTranslation('common');
  const { unitPreference } = useUnitFormat();

  const [units, setUnits] = useState<UnitPreference>(unitPreference);

  // Sync with user preference once it loads (logged-in users)
  useEffect(() => {
    setUnits(unitPreference);
  }, [unitPreference]);

  const isImperial = units === 'imperial';

  const [ratio, setRatio] = useState<Ratio>('1:1');
  const [selectedContainer, setSelectedContainer] = useState<number | null>(1);
  const [customVolumeLiters, setCustomVolumeLiters] = useState<number>(1);
  const [isCustomContainer, setIsCustomContainer] = useState(false);

  const containers = isImperial ? IMPERIAL_CONTAINERS : METRIC_CONTAINERS;

  const { sugar, water } = RATIOS.find(r => r.id === ratio)!;

  const containerLiters = isCustomContainer
    ? customVolumeLiters
    : (selectedContainer ?? 1);

  const results = useMemo(
    () => calculateSyrup(containerLiters, sugar, water),
    [containerLiters, sugar, water],
  );

  const formatWeight = (grams: number): string => {
    if (isImperial) {
      return `${formatNum(grams / 453.592, 1)} lb`;
    }
    return grams >= 1000
      ? `${formatNum(grams / 1000, 2)} kg`
      : `${formatNum(Math.round(grams))} g`;
  };

  const formatVolume = (liters: number): string => {
    if (isImperial) {
      const quarts = liters * 1.05669;
      return quarts >= 4
        ? `${formatNum(quarts / 4, 2)} gal`
        : `${formatNum(quarts, 2)} qt`;
    }
    return liters < 1
      ? `${formatNum(liters * 1000)} ml`
      : `${formatNum(liters, 2)} L`;
  };

  const waterDisplay = formatVolume(results.waterLiters);
  const waterWeightDisplay = formatWeight(results.waterGrams);
  const sugarDisplay = formatWeight(results.sugarGrams);
  const totalDisplay = formatWeight(results.totalGrams);

  const handleContainerSelect = (valueLiters: number) => {
    setSelectedContainer(valueLiters);
    setIsCustomContainer(false);
  };

  const handleCustomContainer = () => {
    setIsCustomContainer(true);
    setSelectedContainer(null);
  };

  const handleCustomVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) {
      setCustomVolumeLiters(isImperial ? val / 1.05669 : val);
    }
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Sugar Syrup Calculator',
        url: 'https://hivepal.app/tools/syrup-calculator',
        applicationCategory: 'UtilitiesApplication',
        applicationSubCategory: 'Beekeeping Calculator',
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript',
        description:
          'Free calculator for bee feeding syrup. Computes exact sugar and water amounts for 1:1, 3:2, or 2:1 ratios at any container size, in metric or imperial units.',
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Hive Pal',
          url: 'https://hivepal.app',
        },
      },
      {
        '@type': 'HowTo',
        name: 'How to make sugar syrup for bees',
        description:
          'Step-by-step recipe for preparing 1:1, 3:2, or 2:1 sugar syrup for feeding honey bees, with sugar and water amounts calculated for any container size.',
        step: [
          {
            '@type': 'HowToStep',
            name: 'Measure the water',
            text: `Measure ${waterDisplay} (${waterWeightDisplay}) of water.`,
          },
          {
            '@type': 'HowToStep',
            name: 'Warm the water',
            text: 'Heat the water until warm (not boiling).',
          },
          {
            '@type': 'HowToStep',
            name: 'Add the sugar',
            text: `Add ${sugarDisplay} of white granulated sugar.`,
          },
          {
            '@type': 'HowToStep',
            name: 'Stir to dissolve',
            text: 'Stir until the sugar is completely dissolved.',
          },
          {
            '@type': 'HowToStep',
            name: 'Cool before feeding',
            text: 'Let the syrup cool to room temperature before feeding.',
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What sugar-to-water ratio should I use to feed bees?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Use 1:1 syrup (equal parts sugar and water by weight) in spring to stimulate brood rearing, 3:2 as a general-purpose feed, and 2:1 (two parts sugar to one part water) in fall to build winter stores. Thick syrup is easier for bees to convert to capped stores; thin syrup mimics a nectar flow.',
            },
          },
          {
            '@type': 'Question',
            name: 'When should I feed bees thin (1:1) syrup?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Feed 1:1 syrup in spring or whenever you want to stimulate brood rearing. Its water content mimics a natural nectar flow, encouraging the queen to lay and the colony to build up.',
            },
          },
          {
            '@type': 'Question',
            name: 'When should I feed bees thick (2:1) syrup?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Feed 2:1 syrup in late summer and fall to help colonies build winter stores. The lower water content means bees spend less energy evaporating it before capping.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I use brown sugar, honey, or molasses to make bee syrup?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. Use only white granulated cane or beet sugar. Brown sugar, molasses, and unrefined sweeteners contain compounds that cause dysentery in bees. Honey from unknown sources can also transmit disease.',
            },
          },
          {
            '@type': 'Question',
            name: 'Should I boil sugar syrup for bees?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. Heat the water until warm enough to dissolve the sugar, but do not boil. Boiling sugar syrup produces hydroxymethylfurfural (HMF), which is toxic to bees.',
            },
          },
          {
            '@type': 'Question',
            name: 'How much sugar do I need for one liter of 1:1 syrup?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'For one liter of finished 1:1 syrup, you need roughly 715 g of water and 715 g of white granulated sugar. The exact amounts depend on the ratio and final volume — this calculator computes them based on sucrose displacement.',
            },
          },
        ],
      },
    ],
  };

  return (
    <PageGrid>
      <Helmet>
        <title>Sugar Syrup Calculator for Beekeepers — Hive Pal</title>
        <meta
          name="description"
          content="Free sugar syrup calculator for beekeepers. Compute exact sugar and water amounts for 1:1, 3:2, or 2:1 syrup at any container size, in metric or imperial units."
        />
        <link
          rel="canonical"
          href="https://hivepal.app/tools/syrup-calculator"
        />
        <meta
          property="og:title"
          content="Sugar Syrup Calculator for Beekeepers — Hive Pal"
        />
        <meta
          property="og:description"
          content="Free calculator for bee sugar syrup. Get precise sugar and water amounts for 1:1, 3:2, or 2:1 ratios at any container size."
        />
        <meta
          property="og:url"
          content="https://hivepal.app/tools/syrup-calculator"
        />
        <meta property="og:type" content="website" />
        <meta property="twitter:card" content="summary" />
        <meta
          property="twitter:title"
          content="Sugar Syrup Calculator for Beekeepers — Hive Pal"
        />
        <meta
          property="twitter:description"
          content="Free calculator for bee sugar syrup. Get precise sugar and water amounts for any ratio and container size."
        />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <MainContent>
        <h1 className="text-2xl font-bold mb-1">
          {t('syrupCalculator.title')}
        </h1>
        <p className="text-muted-foreground mb-3">
          {t('syrupCalculator.description')}
        </p>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {t('syrupCalculator.intro')}
        </p>

        {/* Units */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              {t('syrupCalculator.units')}
            </CardTitle>
            <CardDescription>
              {t('syrupCalculator.unitsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Pill
                active={units === 'metric'}
                onClick={() => setUnits('metric')}
              >
                {t('syrupCalculator.metric')}
              </Pill>
              <Pill
                active={units === 'imperial'}
                onClick={() => setUnits('imperial')}
              >
                {t('syrupCalculator.imperial')}
              </Pill>
            </div>
          </CardContent>
        </Card>

        {/* Ratio Selection */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5" />
              {t('syrupCalculator.ratio')}
            </CardTitle>
            <CardDescription>
              {t('syrupCalculator.ratioDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Pill
                active={ratio === '1:1'}
                onClick={() => setRatio('1:1')}
              >
                {t('syrupCalculator.thin')}
              </Pill>
              <Pill
                active={ratio === '3:2'}
                onClick={() => setRatio('3:2')}
              >
                {t('syrupCalculator.medium')}
              </Pill>
              <Pill
                active={ratio === '2:1'}
                onClick={() => setRatio('2:1')}
              >
                {t('syrupCalculator.thick')}
              </Pill>
            </div>
          </CardContent>
        </Card>

        {/* Container Size */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CookingPot className="h-5 w-5" />
              {t('syrupCalculator.containerSize')}
            </CardTitle>
            <CardDescription>
              {t('syrupCalculator.containerDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {containers.map(c => (
                <Pill
                  key={c.label}
                  active={
                    !isCustomContainer &&
                    selectedContainer === c.valueLiters
                  }
                  onClick={() => handleContainerSelect(c.valueLiters)}
                >
                  {c.label}
                </Pill>
              ))}
              <Pill
                active={isCustomContainer}
                onClick={handleCustomContainer}
              >
                {t('syrupCalculator.customSize')}
              </Pill>
            </div>

            {isCustomContainer && (
              <div className="mt-4 flex items-center gap-2">
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  defaultValue={1}
                  onChange={handleCustomVolumeChange}
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">
                  {isImperial ? 'qt' : 'L'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              {t('syrupCalculator.results')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 text-center">
                <Droplets className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="text-sm text-muted-foreground mb-1">
                  {t('syrupCalculator.water')}
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {waterDisplay}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ({waterWeightDisplay})
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-4 text-center">
                <Beaker className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                <div className="text-sm text-muted-foreground mb-1">
                  {t('syrupCalculator.sugar')}
                </div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {sugarDisplay}
                </div>
              </div>

              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4 text-center">
                <Scale className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <div className="text-sm text-muted-foreground mb-1">
                  {t('syrupCalculator.totalWeight')}
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {totalDisplay}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CookingPot className="h-5 w-5" />
              {t('syrupCalculator.instructions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                {t('syrupCalculator.step1', {
                  water: `${waterDisplay} (${waterWeightDisplay})`,
                })}
              </li>
              <li>{t('syrupCalculator.step2')}</li>
              <li>
                {t('syrupCalculator.step3', {
                  sugar: sugarDisplay,
                })}
              </li>
              <li>{t('syrupCalculator.step4')}</li>
              <li>{t('syrupCalculator.step5')}</li>
            </ol>
          </CardContent>
        </Card>
      </MainContent>

      <PageAside>
        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              {t('syrupCalculator.tips')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold">
                  {t('syrupCalculator.tip1Title')}
                </h4>
                <p className="text-muted-foreground">
                  {t('syrupCalculator.tip1Description')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold">
                  {t('syrupCalculator.tip2Title')}
                </h4>
                <p className="text-muted-foreground">
                  {t('syrupCalculator.tip2Description')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold">
                  {t('syrupCalculator.tip3Title')}
                </h4>
                <p className="text-muted-foreground">
                  {t('syrupCalculator.tip3Description')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold">
                  {t('syrupCalculator.tip4Title')}
                </h4>
                <p className="text-muted-foreground">
                  {t('syrupCalculator.tip4Description')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageAside>
    </PageGrid>
  );
}
