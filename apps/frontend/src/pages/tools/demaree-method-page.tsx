import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  ShieldAlert,
  Waypoints,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { InspectionStatus, type HiveResponse } from 'shared-schemas';
import { useCreateInspection, useHives } from '@/api/hooks';
import { useAuth } from '@/context/auth-context';
import {
  MainContent,
  PageAside,
  PageGrid,
} from '@/components/layout/page-grid-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerPopover } from '@/components/common/date-picker-popover';
import {
  CalloutCard,
  DotList,
  ToolMeta,
  ToolPageHeader,
  ToolFaq,
  buildFaqJsonLd,
  type FaqItem,
} from '@/components/tool-page';
import { cn } from '@/lib/utils';
import { toInspectionDateISOString } from '@/utils/inspection-date';
import {
  type DemareeCheckpointPlan,
  type DemareeWarning,
  type DemareeWarningCode,
  generateDemareePlan,
  getDemareeWarnings,
} from './demaree-planner';

type EditableCheckpoint = DemareeCheckpointPlan & {
  notes: string;
};

const warningVariantClasses: Record<DemareeWarningCode, string> = {
  lateQueenCellCheck: 'border-amber-300 bg-amber-50 dark:bg-amber-950/30',
  unsafeCheckpointSpacing: 'border-orange-300 bg-orange-50 dark:bg-orange-950/30',
  illogicalScheduleOrder: 'border-red-300 bg-red-50 dark:bg-red-950/30',
};

function buildCheckpointNotes(
  checkpoint: DemareeCheckpointPlan,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const checklist = checkpoint.checklistKeys.map(key => `- ${t(key)}`).join('\n');

  return [
    `${t('swarmManagement.planner.checkpointPrefix')} ${t(checkpoint.titleKey)}`,
    t(checkpoint.summaryKey),
    '',
    t('swarmManagement.planner.notesChecklistLabel'),
    checklist,
  ].join('\n');
}

function WarningSummary({
  warning,
  t,
}: Readonly<{
  warning: DemareeWarning;
  t: (key: string, options?: Record<string, unknown>) => string;
}>) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        warningVariantClasses[warning.code],
      )}
    >
      <p className="font-medium">
        {t(`swarmManagement.warnings.${warning.code}.title`)}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(`swarmManagement.warnings.${warning.code}.description`)}
      </p>
    </div>
  );
}

const METHOD_DETAIL_SECTIONS = [
  {
    id: 'preparation',
    items: [0, 1] as number[],
    children: { 0: [0] as number[] } as Record<number, number[]>,
  },
  {
    id: 'huntTheQueen',
    items: [0, 1] as number[],
    children: {} as Record<number, number[]>,
  },
  {
    id: 'broodManipulation',
    items: [0, 1, 2] as number[],
    children: {
      0: [0],
      1: [0],
      2: [0, 1, 2],
    } as Record<number, number[]>,
  },
  {
    id: 'reassembly',
    items: [0, 1, 2, 3, 4] as number[],
    children: {} as Record<number, number[]>,
  },
];

export function DemareeMethodPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { data: hives = [], isLoading: isLoadingHives } = useHives();
  const { mutateAsync: createInspection, isPending: isSaving } =
    useCreateInspection();

  const [selectedHiveId, setSelectedHiveId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [checkpoints, setCheckpoints] = useState<EditableCheckpoint[]>([]);

  const warnings = useMemo(() => getDemareeWarnings(checkpoints), [checkpoints]);

  const selectedHive = hives.find(hive => hive.id === selectedHiveId);

  // Visible FAQ and FAQPage structured data share one translated source.
  const faqItems = t('swarmManagement.demaree.faq.items', {
    returnObjects: true,
  }) as FaqItem[];

  const handleGeneratePlan = () => {
    if (!startDate) return;

    const nextCheckpoints = generateDemareePlan(startDate).map(checkpoint => ({
      ...checkpoint,
      notes: buildCheckpointNotes(checkpoint, t),
    }));

    setCheckpoints(nextCheckpoints);
  };

  const updateCheckpoint = (
    checkpointId: EditableCheckpoint['id'],
    updates: Partial<EditableCheckpoint>,
  ) => {
    setCheckpoints(currentCheckpoints =>
      currentCheckpoints.map(checkpoint =>
        checkpoint.id === checkpointId
          ? { ...checkpoint, ...updates }
          : checkpoint,
      ),
    );
  };

  const getCheckpointWarnings = (checkpointId: EditableCheckpoint['id']) =>
    warnings.filter(warning => warning.checkpointIds.includes(checkpointId));

  const handleSavePlan = async () => {
    if (!selectedHiveId || checkpoints.length === 0) return;

    const results = await Promise.allSettled(
      checkpoints.map(checkpoint =>
        createInspection({
          hiveId: selectedHiveId,
          date: toInspectionDateISOString(checkpoint.date, true),
          isAllDay: true,
          notes: checkpoint.notes,
          status: InspectionStatus.SCHEDULED,
          actions: [],
        }),
      ),
    );

    const successCount = results.filter(
      result => result.status === 'fulfilled',
    ).length;
    const failedCount = results.length - successCount;

    if (successCount === checkpoints.length) {
      toast.success(
        t('swarmManagement.planner.saveSuccess', { count: successCount }),
      );
      navigate('/inspections/list/upcoming');
      return;
    }

    if (successCount > 0) {
      toast.warning(
        t('swarmManagement.planner.partialSave', {
          successCount,
          failedCount,
        }),
      );
      navigate('/inspections/list/upcoming');
      return;
    }

    if (failedCount > 0) {
      toast.error(t('swarmManagement.planner.saveError'));
    }
  };

  const handleCancel = () => {
    setCheckpoints([]);
    navigate('/tools/swarm-management');
  };

  const renderHiveSelect = () => {
    if (isLoadingHives) {
      return <Skeleton className="h-10 w-full" />;
    }

    if (hives.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          {t('swarmManagement.planner.noHives')}
        </p>
      );
    }

    return (
      <Select value={selectedHiveId} onValueChange={setSelectedHiveId}>
        <SelectTrigger>
          <SelectValue
            placeholder={t('swarmManagement.planner.hivePlaceholder')}
          />
        </SelectTrigger>
        <SelectContent>
          {hives.map((hive: HiveResponse) => (
            <SelectItem key={hive.id} value={hive.id}>
              {hive.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Demaree Swarm-Control Method Guide and Planner',
        url: 'https://hivepal.app/tools/swarm-management/demaree',
        applicationCategory: 'EducationalApplication',
        applicationSubCategory: 'Beekeeping Reference',
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript',
        description:
          'Reference guide and inspection planner for the Demaree swarm-control method, with prerequisites, step-by-step instructions, pros/cons, and follow-up timing.',
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
        name: 'How to perform the Demaree swarm-control method',
        description:
          'Step-by-step Demaree procedure for relieving swarm pressure in a strong honey bee colony without splitting it into separate units.',
        step: [
          {
            '@type': 'HowToStep',
            name: 'Preparation',
            text: 'Place a spare brood box with drawn comb or foundation on the hive floor below the existing brood.',
          },
          {
            '@type': 'HowToStep',
            name: 'Hunt the queen',
            text: 'Find the laying queen, place her and the frame she is on into the centre of the new bottom box, and remove any queen cells from that frame.',
          },
          {
            '@type': 'HowToStep',
            name: 'Brood manipulation',
            text: 'Consolidate brood frames above and knock down every queen cell. Shake bees off frames to make sure no cells are missed.',
          },
          {
            '@type': 'HowToStep',
            name: 'Reassembly',
            text: 'Stack queen excluder, two or more honey supers, a second queen excluder, and the brood box above. Refit the crown board and roof.',
          },
          {
            '@type': 'HowToStep',
            name: 'Follow-up at day 7-8',
            text: 'Inspect the upper brood box for emergency queen cells and remove any that have been started.',
          },
          {
            '@type': 'HowToStep',
            name: 'Follow-up at day 14-15',
            text: 'Recheck for late-started queen cells and confirm the brood arrangement still supports the Demaree setup.',
          },
          {
            '@type': 'HowToStep',
            name: 'Follow-up at day 21-22',
            text: 'Carry out a final review and decide whether the colony can be normalised or still needs close monitoring.',
          },
        ],
      },
      buildFaqJsonLd(faqItems),
    ],
  };

  return (
    <PageGrid>
      <ToolMeta
        title="Demaree Method: Swarm Control Guide and Planner — Hive Pal"
        description="Free reference guide and inspection planner for the Demaree swarm-control method. Prerequisites, step-by-step instructions, follow-up timing, and pros/cons for honey bee beekeepers."
        ogDescription="Step-by-step Demaree method for honey bee swarm control, with follow-up timing and an inspection planner."
        path="/tools/swarm-management/demaree"
        structuredData={structuredData}
      />

      <MainContent>
        <ToolPageHeader
          title={t('swarmManagement.demaree.title')}
          badge={
            <Badge variant="outline">{t('swarmManagement.demaree.badge')}</Badge>
          }
          description={t('swarmManagement.demaree.description')}
          intro={t('swarmManagement.demaree.intro')}
          backLink={{
            to: '/tools/swarm-management',
            label: t('swarmManagement.backToOverview'),
          }}
        />

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('swarmManagement.demaree.overviewTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{t('swarmManagement.demaree.overviewLead')}</p>
              <DotList
                className="space-y-3"
                items={[0, 1, 2].map(i =>
                  t(`swarmManagement.demaree.overviewPoints.${i}`),
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('swarmManagement.demaree.prerequisitesTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-3 pl-5 text-sm text-muted-foreground marker:text-primary/60">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <li key={i}>{t(`swarmManagement.demaree.prerequisites.${i}`)}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('swarmManagement.demaree.advantagesTitle')}</CardTitle>
              <CardDescription>
                {t('swarmManagement.demaree.advantagesDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DotList
                items={[0, 1, 2].map(i =>
                  t(`swarmManagement.demaree.advantages.${i}`),
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('swarmManagement.demaree.stepsTitle')}</CardTitle>
              <CardDescription>
                {t('swarmManagement.demaree.stepsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 text-sm text-muted-foreground">
                {METHOD_DETAIL_SECTIONS.map(section => (
                  <div key={section.id} className="space-y-3">
                    <h3 className="font-semibold text-foreground">
                      {t(`swarmManagement.demaree.methodDetail.${section.id}.title`)}
                    </h3>
                    <ul className="list-disc space-y-2 pl-5 marker:text-primary/60">
                      {section.items.map(itemIndex => (
                        <li key={itemIndex}>
                          <span>
                            {t(
                              `swarmManagement.demaree.methodDetail.${section.id}.items.${itemIndex}.text`,
                            )}
                          </span>
                          {(section.children[itemIndex] ?? []).length > 0 && (
                            <ul className="list-[circle] space-y-2 pl-5 pt-2 marker:text-muted-foreground/60">
                              {(section.children[itemIndex] ?? []).map(childIndex => (
                                <li key={childIndex}>
                                  {t(
                                    `swarmManagement.demaree.methodDetail.${section.id}.items.${itemIndex}.children.${childIndex}`,
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('swarmManagement.demaree.followUpTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-lg border">
                <div className="grid grid-cols-[minmax(80px,auto)_1fr] border-b bg-muted/40 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:px-4 sm:text-sm">
                  <div>{t('swarmManagement.demaree.followUpDayHeader')}</div>
                  <div>{t('swarmManagement.demaree.followUpTaskHeader')}</div>
                </div>
                {[0, 1, 2].map(index => (
                  <div
                    key={index}
                    className="grid grid-cols-[minmax(80px,auto)_1fr] gap-3 border-b px-3 py-3 text-sm last:border-b-0 sm:px-4"
                  >
                    <div className="font-semibold text-foreground">
                      {t(`swarmManagement.demaree.followUp.${index}.day`)}
                    </div>
                    <div className="text-muted-foreground">
                      {t(`swarmManagement.demaree.followUp.${index}.task`)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-muted-foreground dark:bg-amber-950/30">
                <p className="flex items-start gap-2 font-medium text-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  {t('swarmManagement.aside.criticalTimingTitle')}
                </p>
                <p className="mt-2">{t('swarmManagement.aside.criticalTimingLead')}</p>
                <p className="mt-2">{t('swarmManagement.aside.criticalTimingDetail')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('swarmManagement.demaree.prosConsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <p className="mb-3 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    {t('swarmManagement.demaree.prosTitle')}
                  </p>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground marker:text-emerald-600/60">
                    {[0, 1, 2, 3, 4].map(i => (
                      <li key={i}>{t(`swarmManagement.demaree.pros.${i}`)}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                  <p className="mb-3 text-sm font-semibold text-rose-900 dark:text-rose-200">
                    {t('swarmManagement.demaree.consTitle')}
                  </p>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground marker:text-rose-600/60">
                    {[0, 1, 2, 3, 4].map(i => (
                      <li key={i}>{t(`swarmManagement.demaree.cons.${i}`)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('swarmManagement.planner.title')}</CardTitle>
              <CardDescription>
                {t('swarmManagement.planner.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isLoggedIn ? (
                <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center">
                  <p className="text-base font-semibold text-foreground">
                    {t('swarmManagement.planner.signInTitle')}
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    {t('swarmManagement.planner.signInDescription')}
                  </p>
                  <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
                    <Button asChild>
                      <Link to="/login">{t('swarmManagement.planner.signInCta')}</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/register">
                        {t('swarmManagement.planner.registerCta')}
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {t('swarmManagement.planner.hiveLabel')}
                      </p>
                      {renderHiveSelect()}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {t('swarmManagement.planner.startDateLabel')}
                      </p>
                      <DatePickerPopover
                        date={startDate}
                        onDateChange={setStartDate}
                        placeholder={t(
                          'swarmManagement.planner.startDatePlaceholder',
                        )}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full sm:w-auto"
                    onClick={handleGeneratePlan}
                    disabled={!selectedHiveId || !startDate}
                  >
                    {t('swarmManagement.planner.generate')}
                  </Button>

                  {selectedHive && (
                    <Alert>
                      <Waypoints className="h-4 w-4" />
                      <AlertTitle>
                        {t('swarmManagement.planner.selectedHive')}
                      </AlertTitle>
                      <AlertDescription>{selectedHive.name}</AlertDescription>
                    </Alert>
                  )}

                  {warnings.length > 0 && (
                    <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>
                        {t('swarmManagement.warnings.bannerTitle')}
                      </AlertTitle>
                      <AlertDescription className="mt-3 space-y-3">
                        {warnings.map(warning => (
                          <WarningSummary
                            key={`${warning.code}-${warning.checkpointIds.join('-')}`}
                            warning={warning}
                            t={t}
                          />
                        ))}
                      </AlertDescription>
                    </Alert>
                  )}

                  {checkpoints.length > 0 ? (
                    <div className="space-y-4">
                      {checkpoints.map(checkpoint => {
                        const checkpointWarnings = getCheckpointWarnings(
                          checkpoint.id,
                        );

                        return (
                          <Card key={checkpoint.id}>
                            <CardHeader>
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <CardTitle>{t(checkpoint.titleKey)}</CardTitle>
                                  <CardDescription>
                                    {t('swarmManagement.planner.dayOffset', {
                                      count: checkpoint.dayOffset,
                                    })}
                                  </CardDescription>
                                </div>
                                <DatePickerPopover
                                  date={checkpoint.date}
                                  onDateChange={date => {
                                    if (date) {
                                      updateCheckpoint(checkpoint.id, { date });
                                    }
                                  }}
                                  align="end"
                                  className="w-full sm:w-auto"
                                />
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                {t(checkpoint.summaryKey)}
                              </p>
                              {checkpointWarnings.map(warning => (
                                <Alert
                                  key={`${checkpoint.id}-${warning.code}`}
                                  className={warningVariantClasses[warning.code]}
                                >
                                  <ShieldAlert className="h-4 w-4" />
                                  <AlertTitle>
                                    {t(
                                      `swarmManagement.warnings.${warning.code}.title`,
                                    )}
                                  </AlertTitle>
                                  <AlertDescription>
                                    {t(
                                      `swarmManagement.warnings.${warning.code}.description`,
                                    )}
                                  </AlertDescription>
                                </Alert>
                              ))}
                              <div className="space-y-2">
                                <p className="text-sm font-medium">
                                  {t('swarmManagement.planner.notesLabel')}
                                </p>
                                <Textarea
                                  value={checkpoint.notes}
                                  onChange={event =>
                                    updateCheckpoint(checkpoint.id, {
                                      notes: event.target.value,
                                    })
                                  }
                                  rows={8}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}

                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button variant="outline" onClick={handleCancel}>
                          {t('actions.cancel')}
                        </Button>
                        <Button onClick={handleSavePlan} disabled={isSaving}>
                          {isSaving
                            ? t('swarmManagement.planner.saving')
                            : t('swarmManagement.planner.save')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                      {t('swarmManagement.planner.emptyState')}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <ToolFaq title={t('swarmManagement.demaree.faq.title')} items={faqItems} />
      </MainContent>

      <PageAside>
        <div className="space-y-4 md:sticky md:top-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-5 w-5 text-primary" />
                {t('swarmManagement.planner.atAGlanceTitle')}
              </CardTitle>
              <CardDescription>
                {t('swarmManagement.planner.atAGlanceDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                {[0, 1, 2].map(i => (
                  <li
                    key={i}
                    className="flex gap-3 border-b pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-[68px] font-semibold text-foreground">
                      {t(`swarmManagement.demaree.followUp.${i}.day`)}
                    </div>
                    <div className="text-muted-foreground">
                      {t(`swarmManagement.demaree.followUp.${i}.task`)}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <CalloutCard
            variant="amber"
            icon={<AlertTriangle className="h-5 w-5" />}
            title={t('swarmManagement.aside.criticalTimingTitle')}
          >
            <p>{t('swarmManagement.aside.criticalTimingLead')}</p>
            <p>{t('swarmManagement.aside.criticalTimingDetail')}</p>
          </CalloutCard>
        </div>
      </PageAside>
    </PageGrid>
  );
}
