import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarIcon,
  ShieldAlert,
  Waypoints,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { InspectionStatus, type HiveResponse } from 'shared-schemas';
import { useCreateInspection, useHives } from '@/api/hooks';
import {
  MainContent,
  PageAside,
  PageGrid,
} from '@/components/layout/page-grid-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
}: {
  warning: DemareeWarning;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
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

export function DemareeMethodPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { data: hives = [], isLoading: isLoadingHives } = useHives();
  const { mutateAsync: createInspection, isPending: isSaving } =
    useCreateInspection();

  const [selectedHiveId, setSelectedHiveId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [checkpoints, setCheckpoints] = useState<EditableCheckpoint[]>([]);

  const warnings = useMemo(() => getDemareeWarnings(checkpoints), [checkpoints]);

  const selectedHive = hives.find(hive => hive.id === selectedHiveId);

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

  return (
    <PageGrid>
      <MainContent>
        <div className="mb-6 space-y-2">
          <Button
            variant="ghost"
            className="mb-2 -ml-3"
            onClick={() => navigate('/tools/swarm-management')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('swarmManagement.backToOverview')}
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">
              {t('swarmManagement.demaree.title')}
            </h1>
            <Badge variant="outline">{t('swarmManagement.demaree.badge')}</Badge>
          </div>
          <p className="text-muted-foreground">
            {t('swarmManagement.demaree.description')}
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('swarmManagement.demaree.overviewTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{t('swarmManagement.demaree.overviewLead')}</p>
              <ul className="space-y-3">
                <li>{t('swarmManagement.demaree.overviewPoints.0')}</li>
                <li>{t('swarmManagement.demaree.overviewPoints.1')}</li>
                <li>{t('swarmManagement.demaree.overviewPoints.2')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('swarmManagement.demaree.prerequisitesTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-3 pl-5 text-sm text-muted-foreground">
                {[
                  'swarmManagement.demaree.prerequisites.0',
                  'swarmManagement.demaree.prerequisites.1',
                  'swarmManagement.demaree.prerequisites.2',
                  'swarmManagement.demaree.prerequisites.3',
                  'swarmManagement.demaree.prerequisites.4',
                  'swarmManagement.demaree.prerequisites.5',
                ].map(key => (
                  <li key={key}>{t(key)}</li>
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
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>{t('swarmManagement.demaree.advantages.0')}</li>
                <li>{t('swarmManagement.demaree.advantages.1')}</li>
                <li>{t('swarmManagement.demaree.advantages.2')}</li>
              </ul>
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
              <div className="space-y-5 text-sm text-muted-foreground">
                {[
                  {
                    id: 'preparation',
                    items: [0, 1],
                    children: { 0: [0] as number[] },
                  },
                  {
                    id: 'huntTheQueen',
                    items: [0, 1],
                    children: {},
                  },
                  {
                    id: 'broodManipulation',
                    items: [0, 1, 2],
                    children: { 0: [0], 1: [0], 2: [0, 1, 2] },
                  },
                  {
                    id: 'reassembly',
                    items: [0, 1, 2, 3, 4],
                    children: {},
                  },
                ].map(section => (
                  <div key={section.id} className="space-y-3">
                    <h3 className="font-semibold text-foreground">
                      {t(`swarmManagement.demaree.methodDetail.${section.id}.title`)}
                    </h3>
                    <ul className="list-disc space-y-2 pl-5">
                      {section.items.map(itemIndex => (
                        <li key={itemIndex}>
                          <span>
                            {t(
                              `swarmManagement.demaree.methodDetail.${section.id}.items.${itemIndex}.text`,
                            )}
                          </span>
                          {(section.children[itemIndex] ?? []).length > 0 && (
                            <ul className="list-disc space-y-2 pl-5 pt-2">
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
                <div className="grid grid-cols-[120px_1fr] border-b bg-muted/40 px-4 py-2 text-sm font-medium">
                  <div>{t('swarmManagement.demaree.followUpDayHeader')}</div>
                  <div>{t('swarmManagement.demaree.followUpTaskHeader')}</div>
                </div>
                {[0, 1, 2].map(index => (
                  <div
                    key={index}
                    className="grid grid-cols-[120px_1fr] border-b px-4 py-3 text-sm last:border-b-0"
                  >
                    <div className="font-medium text-foreground">
                      {t(`swarmManagement.demaree.followUp.${index}.day`)}
                    </div>
                    <div className="text-muted-foreground">
                      {t(`swarmManagement.demaree.followUp.${index}.task`)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-muted-foreground dark:bg-amber-950/30">
                <p className="font-medium text-foreground">
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
              <div className="overflow-hidden rounded-lg border">
                <div className="grid grid-cols-1 border-b bg-muted/40 md:grid-cols-2">
                  <div className="border-b px-4 py-2 text-sm font-medium md:border-b-0 md:border-r">
                    {t('swarmManagement.demaree.prosTitle')}
                  </div>
                  <div className="px-4 py-2 text-sm font-medium">
                    {t('swarmManagement.demaree.consTitle')}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="border-b px-4 py-4 md:border-b-0 md:border-r">
                    <ul className="list-disc space-y-3 pl-5 text-sm text-muted-foreground">
                      {[0, 1, 2, 3, 4].map(index => (
                        <li key={index}>
                          {t(`swarmManagement.demaree.pros.${index}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="px-4 py-4">
                    <ul className="list-disc space-y-3 pl-5 text-sm text-muted-foreground">
                      {[0, 1, 2, 3, 4].map(index => (
                        <li key={index}>
                          {t(`swarmManagement.demaree.cons.${index}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
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
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-1">
                  <p className="text-sm font-medium">
                    {t('swarmManagement.planner.hiveLabel')}
                  </p>
                  {renderHiveSelect()}
                </div>

                <div className="space-y-2 md:col-span-1">
                  <p className="text-sm font-medium">
                    {t('swarmManagement.planner.startDateLabel')}
                  </p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !startDate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, 'PPP')
                        ) : (
                          <span>{t('swarmManagement.planner.startDatePlaceholder')}</span>
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
                </div>

                <div className="space-y-2 md:col-span-1 md:self-end">
                  <Button
                    className="w-full"
                    onClick={handleGeneratePlan}
                    disabled={!selectedHiveId || !startDate}
                  >
                    {t('swarmManagement.planner.generate')}
                  </Button>
                </div>
              </div>

              {selectedHive && (
                <Alert>
                  <Waypoints className="h-4 w-4" />
                  <AlertTitle>{t('swarmManagement.planner.selectedHive')}</AlertTitle>
                  <AlertDescription>{selectedHive.name}</AlertDescription>
                </Alert>
              )}

              {warnings.length > 0 && (
                <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{t('swarmManagement.warnings.bannerTitle')}</AlertTitle>
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
                    const checkpointWarnings = getCheckpointWarnings(checkpoint.id);

                    return (
                      <Card key={checkpoint.id}>
                        <CardHeader>
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <CardTitle>{t(checkpoint.titleKey)}</CardTitle>
                              <CardDescription>
                                {t('swarmManagement.planner.dayOffset', {
                                  count: checkpoint.dayOffset,
                                })}
                              </CardDescription>
                            </div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="justify-start">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {format(checkpoint.date, 'PPP')}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                  mode="single"
                                  selected={checkpoint.date}
                                  onSelect={date => {
                                    if (date) {
                                      updateCheckpoint(checkpoint.id, { date });
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
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
                                {t(`swarmManagement.warnings.${warning.code}.title`)}
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
            </CardContent>
          </Card>
        </div>
      </MainContent>

      <PageAside>
        <div className="space-y-4">
        </div>
      </PageAside>
    </PageGrid>
  );
}
