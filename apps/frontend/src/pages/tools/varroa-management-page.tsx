import { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ClipboardList,
  Info,
  ShieldCheck,
  SplitSquareVertical,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  MainContent,
  PageAside,
  PageGrid,
} from '@/components/layout/page-grid-layout';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CalloutCard,
  DotList,
  ToolMeta,
  ToolPageHeader,
} from '@/components/tool-page';
import { cn } from '@/lib/utils';

// Treatment categories drive the badge colors in the timeline; all copy comes
// from i18n under `varroaManagement.*`.
type Treatment = 'biotech' | 'lactic' | 'formic' | 'oxalic';

const TREATMENT_BADGE_CLASSES: Record<Treatment, string> = {
  biotech:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  lactic: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
  formic: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  oxalic:
    'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300',
};

// The five checkpoints of the Aumeier/Liebig/Boecking season plan. Structure
// (period ids + which treatment each cell uses) lives in code; the copy for
// each cell is a `TimelineCellCopy` object in i18n.
const PERIODS: ReadonlyArray<{
  id: string;
  production: { treatment?: Treatment };
  nucleus: { treatment?: Treatment };
}> = [
  {
    id: 'springSummer',
    production: { treatment: 'biotech' },
    nucleus: { treatment: 'lactic' },
  },
  {
    id: 'endOfJuly',
    production: { treatment: 'formic' },
    nucleus: { treatment: 'formic' },
  },
  {
    id: 'lateAugust',
    production: { treatment: 'formic' },
    nucleus: {},
  },
  {
    id: 'september',
    production: { treatment: 'formic' },
    nucleus: { treatment: 'formic' },
  },
  {
    id: 'novemberDecember',
    production: { treatment: 'oxalic' },
    nucleus: { treatment: 'oxalic' },
  },
];

const DIVIDE_AND_TREAT_STEPS = [
  'preparation',
  'dayZero',
  'dayTwo',
  'dayTwentyOne',
  'dayTwentyEight',
  'october',
] as const;

interface TimelineCellCopy {
  badge?: string;
  title?: string;
  items?: string[];
  monitor?: string;
  threshold?: { condition: string; action: string };
  note?: string;
}

function TreatmentBadge({
  treatment,
  label,
}: Readonly<{ treatment: Treatment; label: string }>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        TREATMENT_BADGE_CLASSES[treatment],
      )}
    >
      {label}
    </span>
  );
}

function TimelineCell({
  periodId,
  colony,
  treatment,
}: Readonly<{
  periodId: string;
  colony: 'production' | 'nucleus';
  treatment?: Treatment;
}>) {
  const { t } = useTranslation('common');
  const copy = t(`varroaManagement.timeline.${periodId}.${colony}`, {
    returnObjects: true,
  }) as TimelineCellCopy;

  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground md:hidden">
        {t(`varroaManagement.columns.${colony}.title`)}
      </p>

      {copy.title && (
        <div className="flex flex-wrap items-center gap-2">
          {copy.badge && (
            <span className="inline-flex items-center rounded-md bg-foreground px-2 py-0.5 text-xs font-bold text-background">
              {copy.badge}
            </span>
          )}
          <p className="text-sm font-semibold text-foreground">{copy.title}</p>
          {treatment && !copy.threshold && (
            <TreatmentBadge
              treatment={treatment}
              label={t(`varroaManagement.treatments.${treatment}`)}
            />
          )}
        </div>
      )}

      {copy.items && copy.items.length > 0 && (
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {copy.items.map(item => (
            <li key={item} className="flex gap-2">
              <span
                aria-hidden
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {copy.monitor && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ClipboardList className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{copy.monitor}</span>
        </p>
      )}

      {copy.threshold && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-xs font-semibold text-red-700 dark:text-red-300">
            {copy.threshold.condition}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
            <span>{copy.threshold.action}</span>
            {treatment && (
              <TreatmentBadge
                treatment={treatment}
                label={t(`varroaManagement.treatments.${treatment}`)}
              />
            )}
          </p>
        </div>
      )}

      {copy.note && (
        <p className="text-xs italic text-muted-foreground">{copy.note}</p>
      )}
    </div>
  );
}

function GuideSection({
  icon,
  title,
  summary,
  children,
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  summary: string;
  children: React.ReactNode;
}>) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="transition hover:bg-muted/40">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  {icon}
                  {title}
                </CardTitle>
                <CardDescription className="mt-1.5">{summary}</CardDescription>
              </div>
              <ChevronDown
                className={cn(
                  'mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform',
                  open && 'rotate-180',
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="border-t pt-6">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function DivideAndTreatGuide() {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-6 text-sm text-muted-foreground">
      <div className="space-y-3">
        <p>{t('varroaManagement.divideAndTreat.intro.0')}</p>
        <p>{t('varroaManagement.divideAndTreat.intro.1')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(['flightling', 'broodling'] as const).map(concept => (
          <div
            key={concept}
            className={cn(
              'rounded-lg border p-4',
              concept === 'flightling'
                ? 'border-sky-200 bg-sky-50/50 dark:border-sky-900/40 dark:bg-sky-950/20'
                : 'border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20',
            )}
          >
            <p className="text-sm font-semibold text-foreground">
              {t(`varroaManagement.divideAndTreat.concepts.${concept}.title`)}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t(`varroaManagement.divideAndTreat.concepts.${concept}.subtitle`)}
            </p>
            <ul className="mt-3 space-y-2">
              {(
                t(`varroaManagement.divideAndTreat.concepts.${concept}.points`, {
                  returnObjects: true,
                }) as string[]
              ).map(point => (
                <li key={point} className="flex gap-2">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">
          {t('varroaManagement.divideAndTreat.stepsTitle')}
        </h3>
        <ol className="space-y-4">
          {DIVIDE_AND_TREAT_STEPS.map(step => (
            <li key={step} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {t(`varroaManagement.divideAndTreat.steps.${step}.day`)}
                </Badge>
                <p className="font-semibold text-foreground">
                  {t(`varroaManagement.divideAndTreat.steps.${step}.title`)}
                </p>
              </div>
              <ul className="mt-3 space-y-2">
                {(
                  t(`varroaManagement.divideAndTreat.steps.${step}.items`, {
                    returnObjects: true,
                  }) as string[]
                ).map(item => (
                  <li key={item} className="flex gap-2">
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <p className="mb-3 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
          {t('varroaManagement.divideAndTreat.advantagesTitle')}
        </p>
        <DotList
          items={
            t('varroaManagement.divideAndTreat.advantages', {
              returnObjects: true,
            }) as string[]
          }
          className="space-y-2"
        />
      </div>

      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
        <p className="flex items-start gap-2 font-medium text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          {t('varroaManagement.divideAndTreat.caution.title')}
        </p>
        <p className="mt-2">{t('varroaManagement.divideAndTreat.caution.body')}</p>
        <p className="mt-2">
          {t('varroaManagement.divideAndTreat.caution.robbing')}
        </p>
      </div>
    </div>
  );
}

function MonitoringGuide() {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-6 text-sm text-muted-foreground">
      <p>{t('varroaManagement.monitoring.intro')}</p>

      <DotList
        items={
          t('varroaManagement.monitoring.items', {
            returnObjects: true,
          }) as string[]
        }
      />

      <div>
        <p className="mb-3 font-semibold text-foreground">
          {t('varroaManagement.monitoring.conversionTitle')}
        </p>
        <DotList
          items={
            t('varroaManagement.monitoring.conversion', {
              returnObjects: true,
            }) as string[]
          }
          className="space-y-2"
        />
      </div>

      <p className="text-xs italic">{t('varroaManagement.monitoring.note')}</p>
    </div>
  );
}

export function VarroaManagementPage() {
  const { t } = useTranslation('common');

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Varroa Management Plan for Production Colonies and Nuclei',
        url: 'https://hivepal.app/tools/varroa-management',
        applicationCategory: 'EducationalApplication',
        applicationSubCategory: 'Beekeeping Reference',
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript',
        description:
          'Season-long varroa treatment schedule for production colonies and nucleus colonies, based on natural mite-fall thresholds, with a step-by-step divide-and-treat guide.',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: {
          '@type': 'Organization',
          name: 'Hive Pal',
          url: 'https://hivepal.app',
        },
      },
      {
        '@type': 'HowTo',
        name: 'How to keep varroa under control through the season',
        description:
          'Five-step varroa management plan combining drone brood removal, nucleus formation, mite-fall monitoring, formic acid, and oxalic acid in broodless periods.',
        step: [
          {
            '@type': 'HowToStep',
            name: 'April to July: cut drone brood',
            text: 'Remove capped drone brood from production colonies 3-4 times between April and July.',
          },
          {
            '@type': 'HowToStep',
            name: 'April to July: treat new nuclei with lactic acid',
            text: 'Spray nucleus colonies once with 15% lactic acid in the broodless phase after they are made up.',
          },
          {
            '@type': 'HowToStep',
            name: 'End of July: monitor mite fall after the harvest',
            text: 'Count natural mite fall for exactly 3 days. Treat with formic acid only above 10 mites/day (production colony) or 5 mites/day (nucleus).',
          },
          {
            '@type': 'HowToStep',
            name: 'August/September: late-summer care',
            text: 'Condense the production colony, treat once with formic acid, feed, and re-check mite fall — or make the colony broodless with divide-and-treat and use oxalic acid instead.',
          },
          {
            '@type': 'HowToStep',
            name: 'Late November to mid December: oxalic acid',
            text: 'In the broodless winter period, trickle oxalic acid once if natural mite fall exceeds 1 mite/day.',
          },
        ],
      },
    ],
  };

  return (
    <PageGrid>
      <ToolMeta
        title="Varroa Management Plan: Production Colony and Nucleus Schedule — Hive Pal"
        description="Free season-long varroa treatment schedule for production colonies and nuclei. Mite-fall thresholds, drone brood removal, formic and oxalic acid timing, and the divide-and-treat method explained step by step."
        ogDescription="When to treat which colony against varroa — threshold-based schedule plus the divide-and-treat method."
        path="/tools/varroa-management"
        structuredData={structuredData}
      />

      <MainContent>
        <ToolPageHeader
          eyebrow={t('varroaManagement.eyebrow')}
          title={t('varroaManagement.title')}
          intro={t('varroaManagement.intro')}
        />

        <div className="space-y-6">
          {/* Two-column season plan: production colony left, nucleus right,
              shared time axis in the middle (stacked with period badges on
              mobile). Modeled on the Aumeier "Nie wieder Völkerverluste!"
              poster. */}
          <div className="space-y-6 md:space-y-0">
            <div className="mb-4 hidden gap-4 md:grid md:grid-cols-[1fr_6.5rem_1fr]">
              {(['production', 'nucleus'] as const).map((colony, index) => (
                <div
                  key={colony}
                  className={cn(
                    'rounded-xl bg-foreground px-4 py-3 text-center text-background',
                    index === 1 && 'md:col-start-3',
                  )}
                >
                  <p className="font-semibold">
                    {t(`varroaManagement.columns.${colony}.title`)}
                  </p>
                  <p className="text-xs opacity-80">
                    {t(`varroaManagement.columns.${colony}.subtitle`)}
                  </p>
                </div>
              ))}
            </div>

            {PERIODS.map((period, index) => (
              <div
                key={period.id}
                className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_6.5rem_1fr] md:gap-4"
              >
                <div className="order-first flex items-center justify-center md:order-none md:col-start-2 md:row-start-1 md:flex-col md:justify-stretch">
                  <span
                    aria-hidden
                    className={cn(
                      'hidden w-px flex-1 bg-border md:block',
                      index === 0 && 'invisible',
                    )}
                  />
                  <Badge
                    variant="secondary"
                    className="mt-4 whitespace-normal px-3 py-1 text-center text-xs font-semibold md:mt-0"
                  >
                    {t(`varroaManagement.timeline.${period.id}.time`)}
                  </Badge>
                  <span
                    aria-hidden
                    className={cn(
                      'hidden w-px flex-1 bg-border md:block',
                      index === PERIODS.length - 1 && 'invisible',
                    )}
                  />
                </div>

                <div className="md:col-start-1 md:row-start-1 md:pb-4">
                  <TimelineCell
                    periodId={period.id}
                    colony="production"
                    treatment={period.production.treatment}
                  />
                </div>

                <div className="md:col-start-3 md:row-start-1 md:pb-4">
                  <TimelineCell
                    periodId={period.id}
                    colony="nucleus"
                    treatment={period.nucleus.treatment}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {t('varroaManagement.legend.title')}
            </span>
            {(Object.keys(TREATMENT_BADGE_CLASSES) as Treatment[]).map(
              treatment => (
                <TreatmentBadge
                  key={treatment}
                  treatment={treatment}
                  label={t(`varroaManagement.treatments.${treatment}`)}
                />
              ),
            )}
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="h-3 w-3 rounded-sm border border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
              />
              {t('varroaManagement.legend.threshold')}
            </span>
          </div>

          <GuideSection
            icon={<SplitSquareVertical className="h-5 w-5 text-primary" />}
            title={t('varroaManagement.divideAndTreat.title')}
            summary={t('varroaManagement.divideAndTreat.summary')}
          >
            <DivideAndTreatGuide />
          </GuideSection>

          <GuideSection
            icon={<ClipboardList className="h-5 w-5 text-primary" />}
            title={t('varroaManagement.monitoring.title')}
            summary={t('varroaManagement.monitoring.summary')}
          >
            <MonitoringGuide />
          </GuideSection>
        </div>
      </MainContent>

      <PageAside>
        <div className="space-y-4 md:sticky md:top-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {t('varroaManagement.aside.thresholdsTitle')}
              </CardTitle>
              <CardDescription>
                {t('varroaManagement.aside.thresholdsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border text-sm">
                <div className="grid grid-cols-3 border-b bg-muted/40 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <div>{t('varroaManagement.aside.periodHeader')}</div>
                  <div className="text-center">
                    {t('varroaManagement.aside.productionHeader')}
                  </div>
                  <div className="text-center">
                    {t('varroaManagement.aside.nucleusHeader')}
                  </div>
                </div>
                {(
                  t('varroaManagement.aside.thresholdRows', {
                    returnObjects: true,
                  }) as { period: string; production: string; nucleus: string }[]
                ).map(row => (
                  <div
                    key={row.period}
                    className="grid grid-cols-3 items-center border-b px-3 py-2 last:border-b-0"
                  >
                    <div className="text-xs text-muted-foreground">
                      {row.period}
                    </div>
                    <div className="text-center font-semibold text-red-600 dark:text-red-400">
                      {row.production}
                    </div>
                    <div className="text-center font-semibold text-red-600 dark:text-red-400">
                      {row.nucleus}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {t('varroaManagement.aside.thresholdsNote')}
              </p>
            </CardContent>
          </Card>

          <CalloutCard
            variant="amber"
            icon={<Info className="h-5 w-5" />}
            title={t('varroaManagement.aside.principleTitle')}
          >
            <p>{t('varroaManagement.aside.principleBody')}</p>
          </CalloutCard>

          <CalloutCard
            variant="neutral"
            icon={<BookOpen className="h-5 w-5" />}
            title={t('varroaManagement.aside.sourceTitle')}
          >
            <p>{t('varroaManagement.aside.sourceBody')}</p>
          </CalloutCard>
        </div>
      </PageAside>
    </PageGrid>
  );
}
