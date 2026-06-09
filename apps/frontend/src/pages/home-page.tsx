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
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ArrowUpRight,
  ChevronDown,
  Clock,
  MapPin,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApiaries, useHives } from '@/api/hooks';
import { useApiary } from '@/hooks/use-apiary';
import { useOnboardingNudges } from '@/hooks/use-onboarding-nudges';
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

type EmptyStateCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
  secondary?: React.ReactNode;
};

const EmptyStateCard = ({
  icon,
  title,
  description,
  action,
  secondary,
}: EmptyStateCardProps) => (
  <Card>
    <CardContent className="flex flex-col items-center text-center gap-3 py-10">
      <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground max-w-md">{description}</p>
      </div>
      {action}
      {secondary}
    </CardContent>
  </Card>
);

export const HomePage = () => {
  const { t } = useTranslation('onboarding');
  const { data, isLoading, refetch } = useHives();
  const { activeApiaryId, apiaries, activeApiary } = useApiary();
  const { pendingMemberships } = useApiaries();
  const [locationDismissed, setLocationDismissed] = useLocalStorageBoolean(
    `home-nudge:location-dismissed:${activeApiaryId ?? 'none'}`,
    false,
  );

  // Soft-onboarding toast nudges (add hive / add location).
  useOnboardingNudges();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // User has no apiaries at all — invite them to create one (default apiary is
  // auto-created on registration, so this mainly covers users who removed it).
  if (
    (!apiaries || apiaries.length === 0) &&
    pendingMemberships === 0
  ) {
    return (
      <PageGrid>
        <MainContent>
          <EmptyStateCard
            icon={<Plus className="h-6 w-6 text-amber-600" />}
            title={t('empty.noApiary.title')}
            description={t('empty.noApiary.description')}
            action={
              <Button asChild>
                <Link to="/apiaries/create">{t('empty.noApiary.action')}</Link>
              </Button>
            }
            secondary={
              <Link
                to="/onboarding"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('empty.noApiary.guided')}
              </Link>
            }
          />
        </MainContent>
      </PageGrid>
    );
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
          {activeApiary &&
            activeApiary.latitude == null &&
            !locationDismissed && (
              <Card>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-950/30 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {t('empty.noLocation.title')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('empty.noLocation.description')}
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link to={`/apiaries/${activeApiary.id}/edit`}>
                      {t('empty.noLocation.action')}
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('empty.noLocation.dismiss')}
                    onClick={() => setLocationDismissed(true)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
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
            {data && data.length > 0 ? (
              <HiveList hives={data} />
            ) : (
              <EmptyStateCard
                icon={<Sparkles className="h-6 w-6 text-amber-600" />}
                title={t('empty.noHives.title')}
                description={t('empty.noHives.description')}
                action={
                  <Button asChild>
                    <Link to="/hives/create">{t('empty.noHives.action')}</Link>
                  </Button>
                }
              />
            )}
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
