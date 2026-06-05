import { HiveList } from '@/pages/hive/components';
import {
  MainContent,
  PageAside,
  PageGrid,
} from '@/components/layout/page-grid-layout';
import { HomeActionSidebar } from '@/components/home-action-sidebar';
import { HiveMinimap } from '@/components/hive-minimap';
import { ApiaryHeader } from '@/components/apiary-header';
import { ApiaryTimeline } from '@/components/apiary-timeline';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ArrowUpRight, ChevronDown, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApiaries, useHives } from '@/api/hooks';
import { useApiary } from '@/hooks/use-apiary';
import { useLocalStorageBoolean } from '@/hooks/use-local-storage-boolean';
import { cn } from '@/lib/utils';

type CollapsibleSectionProps = {
  storageKey: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

const CollapsibleSection = ({
  storageKey,
  title,
  action,
  children,
}: CollapsibleSectionProps) => {
  const [open, setOpen] = useLocalStorageBoolean(storageKey, true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between mb-2">
        <CollapsibleTrigger className="group flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              !open && '-rotate-90',
            )}
          />
          {title}
        </CollapsibleTrigger>
        {action}
      </div>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
};

export const HomePage = () => {
  const { data, isLoading, refetch } = useHives();
  const { activeApiaryId, apiaries } = useApiary();
  const { pendingMemberships } = useApiaries();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // User has no apiaries but has pending join requests
  if ((!apiaries || apiaries.length === 0) && pendingMemberships > 0) {
    return (
      <PageGrid>
        <MainContent>
          <Card>
            <CardContent className="flex items-center gap-4 py-8">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Waiting for approval</h2>
                <p className="text-muted-foreground">
                  You&apos;ve requested to join{' '}
                  {pendingMemberships === 1
                    ? 'an apiary'
                    : `${pendingMemberships} apiaries`}
                  . The owner will review your request shortly.
                </p>
              </div>
            </CardContent>
          </Card>
        </MainContent>
      </PageGrid>
    );
  }

  return (
    <PageGrid>
      <MainContent>
        <div className="space-y-6">
          <ApiaryHeader />
          {activeApiaryId && (
            <CollapsibleSection
              storageKey="home-section:minimap"
              title="Hive Layout"
              action={
                <Link
                  to={`/apiaries/${activeApiaryId}?tab=hives`}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Edit Hive Layout
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              }
            >
              <HiveMinimap apiaryId={activeApiaryId} showHeader={false} />
            </CollapsibleSection>
          )}
          <CollapsibleSection
            storageKey="home-section:hives"
            title="Hives"
          >
            <HiveList hives={data ?? []} />
          </CollapsibleSection>
          <ApiaryTimeline />
        </div>
      </MainContent>
      <PageAside>
        <HomeActionSidebar onRefreshData={refetch} />
      </PageAside>
    </PageGrid>
  );
};
