import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  CalendarIcon,
  ChevronRight,
  Inbox,
  Search,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useHives } from '@/api/hooks/useHives';
import { useCreateAction } from '@/api/hooks/useActions';
import { useCreateInspection } from '@/api/hooks/useInspections';
import { useCreateQueen } from '@/api/hooks/useQueens';
import { ActionBuilder, type BuilderHandle } from './bulk/action-builder';
import { InspectionBuilder } from './bulk/inspection-builder';
import { QueenBuilder } from './bulk/queen-builder';
import { StagedQueue } from './bulk/staged-queue';
import { submitStagedItems } from './bulk/submit-staged-items';
import type { BulkTab, StagedItem } from './bulk/types';
import type { ActionData } from '@/pages/inspection/components/inspection-form/schema';

export const BulkActionsPage = () => {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<BulkTab>('action');
  const [selectedHives, setSelectedHives] = useState<string[]>([]);
  const [hiveFilter, setHiveFilter] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actionRef = useRef<BuilderHandle>(null);
  const inspectionRef = useRef<BuilderHandle>(null);
  const queenRef = useRef<BuilderHandle>(null);

  const { data: hives = [], isLoading: hivesLoading } = useHives();
  const { mutateAsync: createAction } = useCreateAction();
  const { mutateAsync: createInspection } = useCreateInspection();
  const { mutateAsync: createQueen } = useCreateQueen();

  const activeRef =
    activeTab === 'action'
      ? actionRef
      : activeTab === 'inspection'
      ? inspectionRef
      : queenRef;

  const filteredHives = useMemo(() => {
    const q = hiveFilter.trim().toLowerCase();
    if (!q) return hives;
    return hives.filter(h => h.name.toLowerCase().includes(q));
  }, [hives, hiveFilter]);

  const allFilteredSelected =
    filteredHives.length > 0 &&
    filteredHives.every(h => selectedHives.includes(h.id));

  const handleHiveSelection = (hiveId: string, checked: boolean) => {
    setSelectedHives(prev =>
      checked ? [...prev, hiveId] : prev.filter(id => id !== hiveId),
    );
  };

  const handleToggleAllVisible = () => {
    if (allFilteredSelected) {
      const visibleIds = new Set(filteredHives.map(h => h.id));
      setSelectedHives(prev => prev.filter(id => !visibleIds.has(id)));
    } else {
      setSelectedHives(prev => {
        const set = new Set(prev);
        for (const h of filteredHives) set.add(h.id);
        return Array.from(set);
      });
    }
  };

  const handleAddToQueue = () => {
    if (selectedHives.length === 0) {
      toast.error(t('bulkAdd.errors.noHives'));
      return;
    }
    const selected = hives
      .filter(h => selectedHives.includes(h.id))
      .map(h => ({ id: h.id, name: h.name }));

    const built = activeRef.current?.buildItems(selected, date) ?? [];
    if (built.length === 0) {
      toast.error(
        activeTab === 'action'
          ? t('bulkAdd.errors.emptyAction')
          : activeTab === 'inspection'
          ? t('bulkAdd.errors.emptyInspection')
          : t('bulkAdd.errors.emptyQueen'),
      );
      return;
    }
    setStagedItems(prev => [...prev, ...built]);
    activeRef.current?.reset();
    toast.success(
      t(built.length === 1 ? 'bulkAdd.toast.addedOne' : 'bulkAdd.toast.addedMany', {
        count: built.length,
      }),
    );
  };

  const handleRemoveItem = (id: string) => {
    setStagedItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateAction = (id: string, action: ActionData) => {
    setStagedItems(prev =>
      prev.map(item =>
        item.id === id && item.kind === 'action' ? { ...item, action } : item,
      ),
    );
    toast.success(t('bulkAdd.toast.actionUpdated'));
  };

  const handleSubmit = async () => {
    if (stagedItems.length === 0) {
      toast.error(t('bulkAdd.errors.noItems'));
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await submitStagedItems(stagedItems, {
        createAction,
        createInspection,
        createQueen,
      });
      const { counts, failedIds, succeededIds } = result;
      if (failedIds.length === 0) {
        const parts: string[] = [];
        if (counts.action) {
          parts.push(
            t(
              counts.action === 1
                ? 'bulkAdd.toast.breakdown.actionOne'
                : 'bulkAdd.toast.breakdown.actionMany',
              { count: counts.action },
            ),
          );
        }
        if (counts.inspection) {
          parts.push(
            t(
              counts.inspection === 1
                ? 'bulkAdd.toast.breakdown.inspectionOne'
                : 'bulkAdd.toast.breakdown.inspectionMany',
              { count: counts.inspection },
            ),
          );
        }
        if (counts.queen) {
          parts.push(
            t(
              counts.queen === 1
                ? 'bulkAdd.toast.breakdown.queenOne'
                : 'bulkAdd.toast.breakdown.queenMany',
              { count: counts.queen },
            ),
          );
        }
        toast.success(
          t(
            succeededIds.length === 1
              ? 'bulkAdd.toast.createdOne'
              : 'bulkAdd.toast.createdMany',
            { count: succeededIds.length, breakdown: parts.join(', ') },
          ),
        );
        setStagedItems([]);
      } else {
        toast.error(
          t('bulkAdd.toast.partial', {
            success: succeededIds.length,
            failed: failedIds.length,
          }),
        );
        setStagedItems(prev => prev.filter(i => failedIds.includes(i.id)));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hivesLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground lg:px-8">
        {t('bulkAdd.loading')}
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 lg:px-8">
      <header className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('bulkAdd.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('bulkAdd.subtitle')}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_380px]">
        {/* When + Who */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('bulkAdd.sections.when')}
            </h2>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, 'PPP')
                  ) : (
                    <span>{t('bulkAdd.datePlaceholder')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={d => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </section>

          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('bulkAdd.sections.hives')}
              </h2>
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
                  onClick={handleToggleAllVisible}
                  disabled={filteredHives.length === 0}
                >
                  {allFilteredSelected
                    ? t('bulkAdd.hives.clearVisible')
                    : t('bulkAdd.hives.selectAll')}
                </button>
                <span className="tabular-nums text-muted-foreground">
                  {selectedHives.length}/{hives.length}
                </span>
              </div>
            </div>

            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={hiveFilter}
                onChange={e => setHiveFilter(e.target.value)}
                placeholder={t('bulkAdd.hives.filterPlaceholder')}
                className="h-8 pl-8 text-sm"
              />
            </div>

            <div className="max-h-[calc(100vh-22rem)] min-h-[200px] overflow-y-auto rounded-md border bg-card">
              {filteredHives.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {t('bulkAdd.hives.noMatches', { filter: hiveFilter })}
                </div>
              ) : (
                filteredHives.map(hive => {
                  const checked = selectedHives.includes(hive.id);
                  return (
                    <label
                      key={hive.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-accent/40',
                        checked && 'bg-accent/30',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={c =>
                          handleHiveSelection(hive.id, c as boolean)
                        }
                      />
                      <span className="flex-1 truncate">{hive.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          </section>
        </aside>

        {/* What — builder */}
        <main className="min-w-0 space-y-4">
          <Tabs
            value={activeTab}
            onValueChange={v => setActiveTab(v as BulkTab)}
            className="w-full"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('bulkAdd.sections.what')}
              </h2>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="action">
                  {t('bulkAdd.tabs.actions')}
                </TabsTrigger>
                <TabsTrigger value="inspection">
                  {t('bulkAdd.tabs.inspections')}
                </TabsTrigger>
                <TabsTrigger value="queen">
                  {t('bulkAdd.tabs.queens')}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-4 rounded-md border bg-card p-4 sm:p-6">
              <TabsContent value="action" className="mt-0">
                <ActionBuilder ref={actionRef} />
              </TabsContent>
              <TabsContent value="inspection" className="mt-0">
                <InspectionBuilder ref={inspectionRef} />
              </TabsContent>
              <TabsContent value="queen" className="mt-0">
                <QueenBuilder ref={queenRef} defaultDate={date} />
              </TabsContent>
            </div>
          </Tabs>

          <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-md border bg-background/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="min-w-0 text-xs text-muted-foreground">
              {selectedHives.length === 0
                ? t('bulkAdd.selectHivesHint')
                : t(
                    selectedHives.length === 1
                      ? 'bulkAdd.applyHint'
                      : 'bulkAdd.applyHintPlural',
                    {
                      count: selectedHives.length,
                      date: format(date, 'MMM d, yyyy'),
                    },
                  )}
            </div>
            <Button
              onClick={handleAddToQueue}
              disabled={selectedHives.length === 0}
              data-umami-event="Bulk Add Queue"
              data-umami-event-tab={activeTab}
            >
              {t(`bulkAdd.addToQueue.${activeTab}`)}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </main>

        {/* Queue */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="flex max-h-[calc(100vh-3rem)] flex-col rounded-md border bg-card">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">
                  {t('bulkAdd.sections.queue')}
                </h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {stagedItems.length}
                </span>
              </div>
              {stagedItems.length > 0 && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  onClick={() => setStagedItems([])}
                  disabled={isSubmitting}
                >
                  {t('bulkAdd.queue.clear')}
                </button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {stagedItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4 py-10 text-center">
                  <Inbox className="mb-3 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium">
                    {t('bulkAdd.queue.emptyTitle')}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('bulkAdd.queue.emptyBody')}
                  </p>
                </div>
              ) : (
                <StagedQueue
                  items={stagedItems}
                  onRemove={handleRemoveItem}
                  onUpdateAction={handleUpdateAction}
                />
              )}
            </div>

            <div className="border-t p-3">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || stagedItems.length === 0}
                className="w-full"
                data-umami-event="Bulk Add Submit"
                data-umami-event-count={stagedItems.length.toString()}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting
                  ? t('bulkAdd.queue.submitting')
                  : stagedItems.length === 0
                  ? t('bulkAdd.queue.submit')
                  : t(
                      stagedItems.length === 1
                        ? 'bulkAdd.queue.submitOne'
                        : 'bulkAdd.queue.submitMany',
                      { count: stagedItems.length },
                    )}
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
