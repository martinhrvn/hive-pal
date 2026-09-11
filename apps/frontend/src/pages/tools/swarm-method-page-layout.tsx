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
  ToolFaq,
  ToolPageHeader,
  type FaqItem,
} from '@/components/tool-page';
import { useLocalizedPath } from '@/hooks/use-language-navigation';
import { cn } from '@/lib/utils';
import { toInspectionDateISOString } from '@/utils/inspection-date';

// ---------------------------------------------------------------------------
// Generic types that all planner modules share
// ---------------------------------------------------------------------------

export interface CheckpointTemplate {
  id: string;
  dayOffset: number;
  titleKey: string;
  summaryKey: string;
  checklistKeys: string[];
}

export interface CheckpointPlan extends CheckpointTemplate {
  date: Date;
}

export type WarningCode =
  | 'lateQueenCellCheck'
  | 'unsafeCheckpointSpacing'
  | 'illogicalScheduleOrder';

export interface CheckpointWarning {
  code: WarningCode;
  checkpointIds: string[];
}

type EditableCheckpoint = CheckpointPlan & { notes: string };

// ---------------------------------------------------------------------------
// Method-detail section descriptor (same shape used in all three pages)
// ---------------------------------------------------------------------------

export interface MethodDetailSection {
  id: string;
  items: number[];
  children: Record<number, number[]>;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SwarmMethodPageProps {
  /** i18n namespace prefix, e.g. "swarmManagement.pagden" */
  ns: string;
  /** Shared planner namespace for generic UI strings, e.g. "swarmManagement.planner" */
  plannerNs: string;
  /** Planner-specific namespace for method-scoped date label/toast keys */
  methodPlannerNs: string;
  /** Number of prerequisites list items */
  prerequisiteCount: number;
  /** Number of pros/cons list items */
  prosConsCount: number;
  /** Sections for the method-detail card */
  methodDetailSections: MethodDetailSection[];
  /** Generate the plan from a start date */
  generatePlan: (startDate: Date) => CheckpointPlan[];
  /** Derive warnings from the current checkpoint list */
  getWarnings: (checkpoints: CheckpointPlan[]) => CheckpointWarning[];
  /** ToolMeta + structured data node (fully method-specific) */
  meta: React.ReactNode;
  /** Structured data for FAQPage (passed separately so it can be included in the page's own JSON-LD graph) */
  faqI18nKey: string;
}

// ---------------------------------------------------------------------------
// Shared warning colour map (all three methods use the same three codes)
// ---------------------------------------------------------------------------

const warningVariantClasses: Record<WarningCode, string> = {
  lateQueenCellCheck: 'border-amber-300 bg-amber-50 dark:bg-amber-950/30',
  unsafeCheckpointSpacing: 'border-orange-300 bg-orange-50 dark:bg-orange-950/30',
  illogicalScheduleOrder: 'border-red-300 bg-red-50 dark:bg-red-950/30',
};

// ---------------------------------------------------------------------------
// Small internal components
// ---------------------------------------------------------------------------

function WarningSummary({
  warning,
}: Readonly<{ warning: CheckpointWarning }>) {
  const { t } = useTranslation('common');
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

// ---------------------------------------------------------------------------
// Main shared layout
// ---------------------------------------------------------------------------

export function SwarmMethodPageLayout({
  ns,
  plannerNs,
  methodPlannerNs,
  prerequisiteCount,
  prosConsCount,
  methodDetailSections,
  generatePlan,
  getWarnings,
  meta,
  faqI18nKey,
}: Readonly<SwarmMethodPageProps>) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const localize = useLocalizedPath();
  const { isLoggedIn } = useAuth();
  const { data: hives = [], isLoading: isLoadingHives } = useHives();
  const { mutateAsync: createInspection, isPending: isSaving } =
    useCreateInspection();

  const [selectedHiveId, setSelectedHiveId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [checkpoints, setCheckpoints] = useState<EditableCheckpoint[]>([]);

  const warnings = useMemo(
    () => getWarnings(checkpoints),
    [checkpoints, getWarnings],
  );

  const selectedHive = hives.find(hive => hive.id === selectedHiveId);

  const faqItems = t(faqI18nKey, { returnObjects: true }) as FaqItem[];

  const buildCheckpointNotes = (checkpoint: CheckpointPlan) => {
    const checklist = checkpoint.checklistKeys
      .map(key => `- ${t(key)}`)
      .join('\n');
    return [
      `${t(`${methodPlannerNs}.checkpointPrefix`)} ${t(checkpoint.titleKey)}`,
      t(checkpoint.summaryKey),
      '',
      t(`${methodPlannerNs}.notesChecklistLabel`),
      checklist,
    ].join('\n');
  };

  const handleGeneratePlan = () => {
    if (!startDate) return;
    setCheckpoints(
      generatePlan(startDate).map(checkpoint => ({
        ...checkpoint,
        notes: buildCheckpointNotes(checkpoint),
      })),
    );
  };

  const updateCheckpoint = (
    checkpointId: string,
    updates: Partial<EditableCheckpoint>,
  ) => {
    setCheckpoints(current =>
      current.map(cp =>
        cp.id === checkpointId ? { ...cp, ...updates } : cp,
      ),
    );
  };

  const getCheckpointWarnings = (checkpointId: string) =>
    warnings.filter(w => w.checkpointIds.includes(checkpointId));

  const handleSavePlan = async () => {
    if (!selectedHiveId || checkpoints.length === 0) return;

    const results = await Promise.allSettled(
      checkpoints.map(cp =>
        createInspection({
          hiveId: selectedHiveId,
          date: toInspectionDateISOString(cp.date, true),
          isAllDay: true,
          notes: cp.notes,
          status: InspectionStatus.SCHEDULED,
          actions: [],
        }),
      ),
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.length - successCount;

    if (successCount === checkpoints.length) {
      toast.success(
        t(`${methodPlannerNs}.savedSuccess`, { count: successCount }),
      );
      navigate(localize('/inspections/list/upcoming'));
      return;
    }

    if (successCount > 0) {
      toast.warning(
        t(`${methodPlannerNs}.savedPartial`, { successCount, failedCount }),
      );
      navigate(localize('/inspections/list/upcoming'));
      return;
    }

    if (failedCount > 0) {
      toast.error(t(`${methodPlannerNs}.savedError`));
    }
  };

  const handleCancel = () => {
    setCheckpoints([]);
    navigate(localize('/tools/swarm-management'));
  };

  const renderHiveSelect = () => {
    if (isLoadingHives) return <Skeleton className="h-10 w-full" />;

    if (hives.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          {t(`${plannerNs}.noHives`)}
        </p>
      );
    }

    return (
      <Select value={selectedHiveId} onValueChange={setSelectedHiveId}>
        <SelectTrigger>
          <SelectValue placeholder={t(`${plannerNs}.hivePlaceholder`)} />
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

  return (
    <PageGrid>
      {meta}

      <MainContent>
        <ToolPageHeader
          title={t(`${ns}.title`)}
          badge={
            <Badge variant="outline">{t(`${ns}.badge`)}</Badge>
          }
          description={t(`${ns}.description`)}
          intro={t(`${ns}.intro`)}
          backLink={{
            to: localize('/tools/swarm-management'),
            label: t('swarmManagement.backToOverview'),
          }}
        />

        <div className="space-y-4">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{t(`${ns}.overviewTitle`)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{t(`${ns}.overviewLead`)}</p>
              <DotList
                className="space-y-3"
                items={[0, 1, 2].map(i => t(`${ns}.overviewPoints.${i}`))}
              />
            </CardContent>
          </Card>

          {/* Prerequisites */}
          <Card>
            <CardHeader>
              <CardTitle>{t(`${ns}.prerequisitesTitle`)}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-3 pl-5 text-sm text-muted-foreground marker:text-primary/60">
                {Array.from({ length: prerequisiteCount }, (_, i) => (
                  <li key={i}>{t(`${ns}.prerequisites.${i}`)}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Why it works */}
          <Card>
            <CardHeader>
              <CardTitle>{t(`${ns}.advantagesTitle`)}</CardTitle>
              <CardDescription>
                {t(`${ns}.advantagesDescription`)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DotList
                items={[0, 1, 2].map(i => t(`${ns}.advantages.${i}`))}
              />
            </CardContent>
          </Card>

          {/* Method detail */}
          <Card>
            <CardHeader>
              <CardTitle>{t(`${ns}.stepsTitle`)}</CardTitle>
              <CardDescription>{t(`${ns}.stepsDescription`)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 text-sm text-muted-foreground">
                {methodDetailSections.map(section => (
                  <div key={section.id} className="space-y-3">
                    <h3 className="font-semibold text-foreground">
                      {t(`${ns}.methodDetail.${section.id}.title`)}
                    </h3>
                    <ul className="list-disc space-y-2 pl-5 marker:text-primary/60">
                      {section.items.map(itemIndex => (
                        <li key={itemIndex}>
                          <span>
                            {t(
                              `${ns}.methodDetail.${section.id}.items.${itemIndex}.text`,
                            )}
                          </span>
                          {(section.children[itemIndex] ?? []).length > 0 && (
                            <ul className="list-[circle] space-y-2 pl-5 pt-2 marker:text-muted-foreground/60">
                              {(section.children[itemIndex] ?? []).map(
                                childIndex => (
                                  <li key={childIndex}>
                                    {t(
                                      `${ns}.methodDetail.${section.id}.items.${itemIndex}.children.${childIndex}`,
                                    )}
                                  </li>
                                ),
                              )}
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

          {/* Follow-up timing */}
          <Card>
            <CardHeader>
              <CardTitle>{t(`${ns}.followUpTitle`)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-lg border">
                <div className="grid grid-cols-[minmax(80px,auto)_1fr] border-b bg-muted/40 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:px-4 sm:text-sm">
                  <div>{t(`${ns}.followUpDayHeader`)}</div>
                  <div>{t(`${ns}.followUpTaskHeader`)}</div>
                </div>
                {[0, 1, 2].map(index => (
                  <div
                    key={index}
                    className="grid grid-cols-[minmax(80px,auto)_1fr] gap-3 border-b px-3 py-3 text-sm last:border-b-0 sm:px-4"
                  >
                    <div className="font-semibold text-foreground">
                      {t(`${ns}.followUp.${index}.day`)}
                    </div>
                    <div className="text-muted-foreground">
                      {t(`${ns}.followUp.${index}.task`)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-muted-foreground dark:bg-amber-950/30">
                <p className="flex items-start gap-2 font-medium text-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  {t('swarmManagement.aside.criticalTimingTitle')}
                </p>
                <p className="mt-2">
                  {t('swarmManagement.aside.criticalTimingLead')}
                </p>
                <p className="mt-2">
                  {t('swarmManagement.aside.criticalTimingDetail')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pros / cons */}
          <Card>
            <CardHeader>
              <CardTitle>{t(`${ns}.prosConsTitle`)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <p className="mb-3 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    {t(`${ns}.prosTitle`)}
                  </p>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground marker:text-emerald-600/60">
                    {Array.from({ length: prosConsCount }, (_, i) => (
                      <li key={i}>{t(`${ns}.pros.${i}`)}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                  <p className="mb-3 text-sm font-semibold text-rose-900 dark:text-rose-200">
                    {t(`${ns}.consTitle`)}
                  </p>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground marker:text-rose-600/60">
                    {Array.from({ length: prosConsCount }, (_, i) => (
                      <li key={i}>{t(`${ns}.cons.${i}`)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Planner */}
          <Card>
            <CardHeader>
              <CardTitle>{t(`${methodPlannerNs}.title`)}</CardTitle>
              <CardDescription>
                {t(`${methodPlannerNs}.description`)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isLoggedIn ? (
                <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center">
                  <p className="text-base font-semibold text-foreground">
                    {t(`${plannerNs}.signInTitle`)}
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    {t(`${plannerNs}.signInDescription`)}
                  </p>
                  <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
                    <Button asChild>
                      <Link to="/login">
                        {t(`${plannerNs}.signInCta`)}
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/register">
                        {t(`${plannerNs}.registerCta`)}
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {t(`${plannerNs}.hiveLabel`)}
                      </p>
                      {renderHiveSelect()}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {t(`${methodPlannerNs}.startDateLabel`)}
                      </p>
                      <DatePickerPopover
                        date={startDate}
                        onDateChange={setStartDate}
                        placeholder={t(`${methodPlannerNs}.startDatePlaceholder`)}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full sm:w-auto"
                    onClick={handleGeneratePlan}
                    disabled={!selectedHiveId || !startDate}
                  >
                    {t(`${plannerNs}.generate`)}
                  </Button>

                  {selectedHive && (
                    <Alert>
                      <Waypoints className="h-4 w-4" />
                      <AlertTitle>
                        {t(`${plannerNs}.selectedHive`)}
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
                          />
                        ))}
                      </AlertDescription>
                    </Alert>
                  )}

                  {checkpoints.length > 0 ? (
                    <div className="space-y-4">
                      {checkpoints.map(checkpoint => {
                        const cpWarnings = getCheckpointWarnings(checkpoint.id);
                        return (
                          <Card key={checkpoint.id}>
                            <CardHeader>
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <CardTitle>
                                    {t(checkpoint.titleKey)}
                                  </CardTitle>
                                  <CardDescription>
                                    {t(`${plannerNs}.dayOffset`, {
                                      count: checkpoint.dayOffset,
                                    })}
                                  </CardDescription>
                                </div>
                                <DatePickerPopover
                                  date={checkpoint.date}
                                  onDateChange={date => {
                                    if (date)
                                      updateCheckpoint(checkpoint.id, { date });
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
                              {cpWarnings.map(warning => (
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
                                  {t(`${plannerNs}.notesLabel`)}
                                </p>
                                <Textarea
                                  value={checkpoint.notes}
                                  onChange={e =>
                                    updateCheckpoint(checkpoint.id, {
                                      notes: e.target.value,
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
                            ? t(`${plannerNs}.saving`)
                            : t(`${plannerNs}.save`)}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                      {t(`${plannerNs}.emptyState`)}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <ToolFaq title={t(`${ns}.faq.title`)} items={faqItems} />
      </MainContent>

      <PageAside>
        <div className="space-y-4 md:sticky md:top-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-5 w-5 text-primary" />
                {t(`${plannerNs}.atAGlanceTitle`)}
              </CardTitle>
              <CardDescription>
                {t(`${plannerNs}.atAGlanceDescription`)}
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
                      {t(`${ns}.followUp.${i}.day`)}
                    </div>
                    <div className="text-muted-foreground">
                      {t(`${ns}.followUp.${i}.task`)}
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
