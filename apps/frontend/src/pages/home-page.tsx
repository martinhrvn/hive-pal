import { useMemo } from 'react';
import { HiveList } from '@/pages/hive/components/hive-list';
import {
  MainContent,
  PageAside,
  PageGrid,
} from '@/components/layout/page-grid-layout';
import { HomeActionSidebar } from '@/components/home-action-sidebar';
import { HiveMinimap } from '@/components/hive-minimap';
import { ApiaryHeader } from '@/components/apiary-header';
import { ApiaryTimeline } from '@/components/apiary-timeline';
import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { EmptyState, IconBadge } from '@/components/dashboard/empty-state';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  Clock,
  HomeIcon,
  MapPin,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import { ApiaryResponse, HiveResponse } from 'shared-schemas';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApiaries, useHivesWithBoxes, useTodos } from '@/api/hooks';
import { useApiary } from '@/hooks/use-apiary';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';
import { TodoList, TodoListSkeleton } from '@/pages/todo/components/todo-list';
import { TodoQuickAdd } from '@/pages/todo/components/todo-quick-add';
import { useLocalStorageBoolean } from '@/hooks/use-local-storage-boolean';

const isSubjectiveApiary = (apiary?: ApiaryResponse) =>
  apiary?.settings?.inspectionType === 'subjective';

// In "view all" mode the dashboard lists hives grouped under each apiary,
// mirroring how BEEP presents apiaries with their hives.
const GroupedHives = ({
  hives,
  apiaries,
}: {
  hives: HiveResponse[];
  apiaries?: ApiaryResponse[];
}) => {
  const groups = useMemo(() => {
    const byApiary = new Map<string, HiveResponse[]>();
    for (const hive of hives) {
      const key = hive.apiaryId ?? '__none__';
      const list = byApiary.get(key);
      if (list) list.push(hive);
      else byApiary.set(key, [hive]);
    }
    // Preserve the apiary order from the switcher; only show apiaries with hives.
    return (apiaries ?? []).flatMap(apiary => {
      const apiaryHives = byApiary.get(apiary.id);
      return apiaryHives ? [{ apiary, hives: apiaryHives }] : [];
    });
  }, [hives, apiaries]);

  return (
    <div className="space-y-8">
      {groups.map(({ apiary, hives: apiaryHives }) => (
        <div key={apiary.id} className="space-y-3">
          <div className="flex items-center gap-2">
            <IconBadge size="sm">
              <HomeIcon />
            </IconBadge>
            <h3 className="font-medium">{apiary.name}</h3>
            <span className="text-xs text-muted-foreground tabular-nums">
              {apiaryHives.length}
            </span>
          </div>
          {/* Each group uses its own apiary's inspection type. */}
          <HiveList
            hives={apiaryHives}
            isSubjective={isSubjectiveApiary(apiary)}
          />
        </div>
      ))}
    </div>
  );
};

const DashboardTodos = () => {
  const { t } = useTranslation('todo');
  const { data, isLoading } = useTodos();
  const { canEdit } = useApiaryPermission();

  const openTodos = useMemo(
    () => (data ?? []).filter(todo => !todo.completed),
    [data],
  );

  return (
    <DashboardSection storageKey="home-section:todos" title={t('list.title')}>
      <div className="space-y-3">
        {canEdit && <TodoQuickAdd />}
        {isLoading ? (
          <TodoListSkeleton />
        ) : (
          <TodoList todos={openTodos} emptyMessage={t('list.emptyOpen')} />
        )}
      </div>
    </DashboardSection>
  );
};

const LocationNudge = ({ apiary }: { apiary: ApiaryResponse }) => {
  const { t } = useTranslation('onboarding');
  const [dismissed, setDismissed] = useLocalStorageBoolean(
    `home-nudge:location-dismissed:${apiary.id}`,
    false,
  );
  if (apiary.latitude != null || dismissed) return null;

  return (
    <Card className="flex-row items-center gap-4 px-4 py-4">
      <IconBadge tone="info">
        <MapPin />
      </IconBadge>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium">{t('empty.noLocation.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('empty.noLocation.description')}
        </p>
      </div>
      <Button asChild size="sm">
        <Link to={`/apiaries/${apiary.id}/edit`}>
          {t('empty.noLocation.action')}
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('empty.noLocation.dismiss')}
        onClick={() => setDismissed(true)}
      >
        <X className="size-4" />
      </Button>
    </Card>
  );
};

export const HomePage = () => {
  const { t } = useTranslation(['onboarding', 'hive']);
  // Boxes come with the list so the hive cards can draw their box gradient
  // without a per-hive detail request.
  const { data: hives, isPending: hivesPending } = useHivesWithBoxes();
  const { activeApiaryId, apiaries, activeApiary, viewAllApiaries } =
    useApiary();
  const { pendingMemberships, isLoading: apiariesLoading } = useApiaries();

  if (apiariesLoading) {
    return <DashboardSkeleton />;
  }

  const hasNoApiaries = !apiaries || apiaries.length === 0;

  // User has no apiaries at all — invite them to create one (default apiary is
  // auto-created on registration, so this mainly covers users who removed it).
  if (hasNoApiaries && pendingMemberships === 0) {
    return (
      <PageGrid>
        <MainContent>
          <EmptyState
            icon={<Plus />}
            title={t('empty.noApiary.title')}
            description={t('empty.noApiary.description')}
          >
            <Button asChild>
              <Link to="/apiaries/create">{t('empty.noApiary.action')}</Link>
            </Button>
            <Link
              to="/onboarding"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('empty.noApiary.guided')}
            </Link>
          </EmptyState>
        </MainContent>
      </PageGrid>
    );
  }

  // User has no apiaries but has pending join requests
  if (hasNoApiaries) {
    return (
      <PageGrid>
        <MainContent>
          <Card className="flex-row items-center gap-4 px-6 py-8">
            <IconBadge size="lg">
              <Clock />
            </IconBadge>
            <div>
              <h2 className="text-lg font-semibold">
                {t('empty.pendingApproval.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('empty.pendingApproval.description', {
                  count: pendingMemberships,
                })}
              </p>
            </div>
          </Card>
        </MainContent>
      </PageGrid>
    );
  }

  // The hive query stays pending until the selected apiary is synced, which
  // avoids flashing the "no hives" state on first load.
  if (hivesPending) {
    return <DashboardSkeleton />;
  }

  return (
    <PageGrid>
      <MainContent>
        <div className="space-y-8">
          {/* Apiary-specific blocks only make sense for a single apiary. */}
          {!viewAllApiaries && (
            <div className="space-y-4">
              <ApiaryHeader />
              {activeApiary && <LocationNudge apiary={activeApiary} />}
            </div>
          )}
          {/* The hive-layout minimap is tied to one apiary's grid. */}
          {activeApiaryId && !viewAllApiaries && (
            <DashboardSection
              storageKey="home-section:minimap"
              title={t('hive:layout.title')}
              action={
                <Link
                  to={`/apiaries/${activeApiaryId}?tab=hives`}
                  className="flex items-center gap-1 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t('hive:layout.edit')}
                  <ArrowUpRight className="size-4" />
                </Link>
              }
            >
              <HiveMinimap apiaryId={activeApiaryId} />
            </DashboardSection>
          )}
          <DashboardSection
            storageKey="home-section:hives"
            title={t('hive:title')}
          >
            {hives && hives.length > 0 ? (
              viewAllApiaries ? (
                <GroupedHives hives={hives} apiaries={apiaries} />
              ) : (
                <HiveList
                  hives={hives}
                  isSubjective={isSubjectiveApiary(activeApiary)}
                />
              )
            ) : (
              <EmptyState
                icon={<Sparkles />}
                title={t('empty.noHives.title')}
                description={t(
                  viewAllApiaries
                    ? 'empty.noHives.descriptionAll'
                    : 'empty.noHives.description',
                )}
              >
                <Button asChild>
                  <Link to="/hives/create">{t('empty.noHives.action')}</Link>
                </Button>
              </EmptyState>
            )}
          </DashboardSection>
          {/* Todos are apiary-scoped but the todos endpoint supports the
              cross-apiary view, so they aggregate across all apiaries here. */}
          <DashboardTodos />
          {/* Every endpoint the timeline mixes (inspections, actions,
              quick-checks, photos, documents) supports the all-apiaries view,
              so it aggregates across apiaries there. */}
          <ApiaryTimeline />
        </div>
      </MainContent>
      <PageAside>
        <HomeActionSidebar />
      </PageAside>
    </PageGrid>
  );
};
