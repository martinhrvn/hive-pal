import { Skeleton } from '@/components/ui/skeleton';
import {
  MainContent,
  PageAside,
  PageGrid,
} from '@/components/layout/page-grid-layout';

/** A hive-card-shaped placeholder, reused by the hive list while it loads. */
export function HiveCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-14" />
        </div>
        <Skeleton className="h-7 w-40" />
        <div className="flex gap-6">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
        </div>
        <Skeleton className="h-px w-full" />
        <Skeleton className="ml-auto h-4 w-24" />
      </div>
    </div>
  );
}

/** Layout-shaped placeholder for the whole home page. */
export function DashboardSkeleton() {
  return (
    <PageGrid>
      <MainContent>
        <div className="space-y-8" aria-busy="true">
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="space-y-4 p-6">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-56" />
              <div className="grid grid-cols-3 gap-4 pt-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-20" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <HiveCardSkeleton />
              <HiveCardSkeleton />
            </div>
          </div>
        </div>
      </MainContent>
      <PageAside>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </PageAside>
    </PageGrid>
  );
}
