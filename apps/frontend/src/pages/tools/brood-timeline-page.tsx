import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { addDays, format } from 'date-fns';
import { Bug, Clock, Lightbulb, CalendarIcon, X } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Pill } from '@/components/common/pill';
import { cn } from '@/lib/utils';

type BeeType = 'queen' | 'worker' | 'drone';
type Stage = 'egg' | 'larva' | 'pupa' | 'adult';

interface StageData {
  stage: Stage;
  startDay: number;
  endDay: number;
}

interface BeeTypeData {
  type: BeeType;
  totalDays: number;
  stages: StageData[];
}

const BEE_DATA: Record<BeeType, BeeTypeData> = {
  queen: {
    type: 'queen',
    totalDays: 16,
    stages: [
      { stage: 'egg', startDay: 0, endDay: 3 },
      { stage: 'larva', startDay: 4, endDay: 7 },
      { stage: 'pupa', startDay: 8, endDay: 15 },
      { stage: 'adult', startDay: 16, endDay: 16 },
    ],
  },
  worker: {
    type: 'worker',
    totalDays: 21,
    stages: [
      { stage: 'egg', startDay: 0, endDay: 3 },
      { stage: 'larva', startDay: 4, endDay: 9 },
      { stage: 'pupa', startDay: 10, endDay: 20 },
      { stage: 'adult', startDay: 21, endDay: 21 },
    ],
  },
  drone: {
    type: 'drone',
    totalDays: 24,
    stages: [
      { stage: 'egg', startDay: 0, endDay: 3 },
      { stage: 'larva', startDay: 4, endDay: 9 },
      { stage: 'pupa', startDay: 10, endDay: 23 },
      { stage: 'adult', startDay: 24, endDay: 24 },
    ],
  },
};

const MAX_DAYS = 25;

const STAGE_COLORS: Record<Stage, string> = {
  egg: 'bg-sky-300 dark:bg-sky-400',
  larva: 'bg-violet-400 dark:bg-violet-500',
  pupa: 'bg-rose-400 dark:bg-rose-500',
  adult: 'bg-emerald-400 dark:bg-emerald-500',
};

const STAGE_DOT_COLORS: Record<Stage, string> = {
  egg: 'bg-sky-400 dark:bg-sky-300',
  larva: 'bg-violet-500 dark:bg-violet-400',
  pupa: 'bg-rose-500 dark:bg-rose-400',
  adult: 'bg-emerald-500 dark:bg-emerald-400',
};

function TimelineBar({
  beeData,
  label,
  startDate,
  compact,
  scaleToMax,
}: {
  beeData: BeeTypeData;
  label?: string;
  startDate?: Date;
  compact?: boolean;
  scaleToMax?: boolean;
}) {
  const totalStages = beeData.totalDays + 1;
  const barWidthPercent = scaleToMax
    ? (totalStages / MAX_DAYS) * 100
    : 100;

  return (
    <div className={compact ? 'mb-3' : 'mb-2'}>
      {label && (
        <div className="text-sm font-medium mb-1.5">{label}</div>
      )}
      <div
        className="flex h-3 rounded-full overflow-hidden"
        style={{ width: `${barWidthPercent}%` }}
      >
        {beeData.stages.map(stage => {
          const duration = stage.endDay - stage.startDay + 1;
          const widthPercent = (duration / totalStages) * 100;
          return (
            <div
              key={stage.stage}
              className={STAGE_COLORS[stage.stage]}
              style={{ width: `${widthPercent}%` }}
            />
          );
        })}
      </div>
      {/* Day tick marks at stage boundaries */}
      <div className="flex mt-1" style={{ width: `${barWidthPercent}%` }}>
        {beeData.stages.map((stage, i) => {
          const duration = stage.endDay - stage.startDay + 1;
          const widthPercent = (duration / totalStages) * 100;
          const isLast = i === beeData.stages.length - 1;
          return (
            <div
              key={stage.stage}
              className="text-[11px] text-muted-foreground leading-tight flex"
              style={{ width: `${widthPercent}%` }}
            >
              <div className="shrink-0">
                <div>{stage.startDay}</div>
                {startDate && (
                  <div className="text-[10px] text-muted-foreground/70">
                    {format(addDays(startDate, stage.startDay), 'MMM d')}
                  </div>
                )}
              </div>
              {isLast && stage.endDay !== stage.startDay && (
                <div className="shrink-0 ml-auto">
                  <div>{stage.endDay}</div>
                  {startDate && (
                    <div className="text-[10px] text-muted-foreground/70">
                      {format(addDays(startDate, stage.endDay), 'MMM d')}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BroodTimelinePage() {
  const { t } = useTranslation('common');

  const [selectedBeeType, setSelectedBeeType] = useState<BeeType>('worker');
  const [showComparison, setShowComparison] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();

  const beeData = BEE_DATA[selectedBeeType];

  const handleBeeTypeSelect = (type: BeeType) => {
    setSelectedBeeType(type);
    setShowComparison(false);
  };

  const handleCompareAll = () => {
    setShowComparison(true);
  };

  const formatDateRange = (startDay: number, endDay: number) => {
    if (!startDate) return null;
    const from = format(addDays(startDate, startDay), 'MMM d');
    if (startDay === endDay) return from;
    const to = format(addDays(startDate, endDay), 'MMM d');
    return `${from} – ${to}`;
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Honey Bee Brood Development Timeline',
        url: 'https://hivepal.app/tools/brood-timeline',
        applicationCategory: 'EducationalApplication',
        applicationSubCategory: 'Beekeeping Reference',
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript',
        description:
          'Visualize honey bee brood development stages (egg, larva, pupa, adult) for queens, workers, and drones. Project capping and emergence dates from any start date.',
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
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How long does it take for a honey bee to develop?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Queens emerge after 16 days, workers after 21 days, and drones after 24 days. All three pass through four stages — egg (3 days), larva, pupa, and adult — but the larval and pupal stages differ in length by caste.',
            },
          },
          {
            '@type': 'Question',
            name: 'When are worker bee cells capped?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Worker brood cells are capped on day 9, when the larva spins its cocoon and enters the pupal stage. Worker bees emerge on day 21.',
            },
          },
          {
            '@type': 'Question',
            name: 'When are queen cells capped and when do queens emerge?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Queen cells are capped on day 8 and virgin queens emerge on day 16 from the egg being laid. Queens develop fastest because they are fed royal jelly throughout the larval stage.',
            },
          },
          {
            '@type': 'Question',
            name: 'How long do drones take to emerge?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Drones take 24 days from egg to emergence — the longest of any caste. Drone cells are capped around day 10.',
            },
          },
        ],
      },
    ],
  };

  return (
    <PageGrid>
      <Helmet>
        <title>Honey Bee Brood Development Timeline — Hive Pal</title>
        <meta
          name="description"
          content="Free brood development timeline for queen, worker, and drone honey bees. Visualize each stage (egg, larva, pupa, adult) with day counts and project capping or emergence dates from any start date."
        />
        <link
          rel="canonical"
          href="https://hivepal.app/tools/brood-timeline"
        />
        <meta
          property="og:title"
          content="Honey Bee Brood Development Timeline — Hive Pal"
        />
        <meta
          property="og:description"
          content="Visualize queen, worker, and drone brood stages with day counts and projected dates."
        />
        <meta
          property="og:url"
          content="https://hivepal.app/tools/brood-timeline"
        />
        <meta property="og:type" content="website" />
        <meta property="twitter:card" content="summary" />
        <meta
          property="twitter:title"
          content="Honey Bee Brood Development Timeline — Hive Pal"
        />
        <meta
          property="twitter:description"
          content="Visualize queen, worker, and drone brood stages with day counts and projected dates."
        />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <MainContent>
        <h1 className="text-2xl font-bold mb-1">
          {t('broodTimeline.title')}
        </h1>
        <p className="text-muted-foreground mb-3">
          {t('broodTimeline.description')}
        </p>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {t('broodTimeline.intro')}
        </p>

        {/* Bee Type Selector */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              {t('broodTimeline.beeType')}
            </CardTitle>
            <CardDescription>
              {t('broodTimeline.beeTypeDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Pill
                active={!showComparison && selectedBeeType === 'queen'}
                onClick={() => handleBeeTypeSelect('queen')}
              >
                {t('broodTimeline.queen')}
              </Pill>
              <Pill
                active={!showComparison && selectedBeeType === 'worker'}
                onClick={() => handleBeeTypeSelect('worker')}
              >
                {t('broodTimeline.worker')}
              </Pill>
              <Pill
                active={!showComparison && selectedBeeType === 'drone'}
                onClick={() => handleBeeTypeSelect('drone')}
              >
                {t('broodTimeline.drone')}
              </Pill>
              <Pill active={showComparison} onClick={handleCompareAll}>
                {t('broodTimeline.compareAll')}
              </Pill>
            </div>
          </CardContent>
        </Card>

        {/* Date Selector */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {t('broodTimeline.dateSelector')}
            </CardTitle>
            <CardDescription>
              {t('broodTimeline.dateSelectorDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-[200px] justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, 'PPP')
                    ) : (
                      <span>{t('broodTimeline.pickDate')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {startDate && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStartDate(undefined)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('broodTimeline.timeline')}
            </CardTitle>
            {!showComparison && (
              <CardDescription>
                {t('broodTimeline.totalDays', { days: beeData.totalDays })}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {showComparison ? (
              <>
                {(['queen', 'worker', 'drone'] as const).map(type => (
                  <TimelineBar
                    key={type}
                    beeData={BEE_DATA[type]}
                    label={`${t(`broodTimeline.${type}`)} (${BEE_DATA[type].totalDays} ${t('broodTimeline.daysUnit')})`}
                    startDate={startDate}
                    compact
                    scaleToMax
                  />
                ))}
              </>
            ) : (
              <TimelineBar beeData={beeData} startDate={startDate} />
            )}

            {/* Legend with stage details */}
            {!showComparison && (
              <div className="mt-6 pt-4 border-t space-y-3">
                {beeData.stages.map(stage => {
                  const duration = stage.endDay - stage.startDay + 1;
                  const dateRange = formatDateRange(
                    stage.startDay,
                    stage.endDay,
                  );
                  return (
                    <div key={stage.stage} className="flex gap-3 items-start">
                      <div
                        className={cn(
                          'h-3 w-3 rounded-full mt-0.5 shrink-0',
                          STAGE_DOT_COLORS[stage.stage],
                        )}
                      />
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {t(`broodTimeline.stage.${stage.stage}`)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {stage.startDay === stage.endDay
                              ? t('broodTimeline.day', {
                                  day: stage.startDay,
                                })
                              : t('broodTimeline.days', {
                                  start: stage.startDay,
                                  end: stage.endDay,
                                })}
                            {' · '}
                            {duration === 1
                              ? t('broodTimeline.durationOne')
                              : t('broodTimeline.durationOther', {
                                  count: duration,
                                })}
                            {dateRange && ` · ${dateRange}`}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t(
                            `broodTimeline.${selectedBeeType}${stage.stage.charAt(0).toUpperCase() + stage.stage.slice(1)}Desc`,
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Minimal legend for comparison view */}
            {showComparison && (
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                {(['egg', 'larva', 'pupa', 'adult'] as const).map(stage => (
                  <div key={stage} className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        STAGE_DOT_COLORS[stage],
                      )}
                    />
                    <span className="text-xs text-muted-foreground">
                      {t(`broodTimeline.stage.${stage}`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </MainContent>

      <PageAside>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              {t('broodTimeline.funFacts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold">
                  {t('broodTimeline.fact1Title')}
                </h4>
                <p className="text-muted-foreground">
                  {t('broodTimeline.fact1Description')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold">
                  {t('broodTimeline.fact2Title')}
                </h4>
                <p className="text-muted-foreground">
                  {t('broodTimeline.fact2Description')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold">
                  {t('broodTimeline.fact3Title')}
                </h4>
                <p className="text-muted-foreground">
                  {t('broodTimeline.fact3Description')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold">
                  {t('broodTimeline.fact4Title')}
                </h4>
                <p className="text-muted-foreground">
                  {t('broodTimeline.fact4Description')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageAside>
    </PageGrid>
  );
}
