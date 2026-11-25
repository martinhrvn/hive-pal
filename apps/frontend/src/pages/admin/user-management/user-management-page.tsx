import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchX, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  useAdminUserCapabilities,
  useAdminUsers,
  useCreateUser,
} from '@/api/hooks/useAdminUsers';
import {
  ColumnVisibilityMenu,
  DataTable,
  useColumnVisibility,
} from '@/components/data-table';
import { ListPagination } from '@/components/common/list-pagination';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CreateUserDialog } from './create-user-dialog';
import { UsersToolbar } from './users-toolbar';
import { useUserColumns } from './use-user-columns';
import { useUserActions } from './use-user-actions';
import { USERS_PAGE_SIZE, useUserListParams } from './use-user-list-params';

export default function UserManagementPage() {
  const { t } = useTranslation('admin');
  const { user: currentUser } = useAuth();
  const { filters, setFilters, hasFilters } = useUserListParams();
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError, isPlaceholderData } = useAdminUsers({
    search: filters.search.trim() || undefined,
    role: filters.role,
    status: filters.status,
    page: filters.page,
    pageSize: USERS_PAGE_SIZE,
  });
  const { data: capabilities } = useAdminUserCapabilities();
  const createUser = useCreateUser();

  const { openAction, dialogs } = useUserActions();
  const columns = useUserColumns(currentUser?.id, openAction);
  const {
    visibleColumns,
    hideableColumns,
    isColumnVisible,
    setColumnVisible,
    resetColumns,
    isCustomised,
  } = useColumnVisibility('admin-users', columns);

  const rows = data?.items ?? [];
  const lastPage = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;

  // A stale ?page= (or deleting the last row of the last page) would otherwise
  // show an empty list with no pager to get back.
  useEffect(() => {
    if (data && filters.page > lastPage) setFilters({ page: lastPage });
  }, [data, filters.page, lastPage, setFilters]);

  return (
    <div className="container mx-auto space-y-8 py-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
          {capabilities && !capabilities.registrationEnabled && (
            <p
              className="text-sm text-muted-foreground"
              data-test="registration-closed-note"
            >
              {t('users.registrationClosed')}
            </p>
          )}
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          data-test="create-user-open"
        >
          <UserPlus className="size-4" aria-hidden />
          {t('users.createButton')}
        </Button>
      </header>

      <UsersToolbar filters={filters} onFiltersChange={setFilters}>
        <ColumnVisibilityMenu
          columns={hideableColumns}
          isColumnVisible={isColumnVisible}
          setColumnVisible={setColumnVisible}
          resetColumns={resetColumns}
          visibleCount={visibleColumns.length}
          isCustomised={isCustomised}
          align="end"
        />
      </UsersToolbar>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{t('messages.failedToFetch')}</AlertDescription>
        </Alert>
      )}

      {isLoading && <UsersTableSkeleton />}

      {data?.total === 0 && (
        <EmptyState
          icon={<SearchX />}
          title={t(hasFilters ? 'users.empty.title' : 'messages.noUsers')}
          description={t(
            hasFilters ? 'users.empty.description' : 'users.empty.noUsers',
          )}
        >
          {hasFilters && (
            <Button
              variant="outline"
              onClick={() =>
                setFilters({ search: '', role: undefined, status: undefined })
              }
            >
              {t('users.empty.clear')}
            </Button>
          )}
        </EmptyState>
      )}

      {data && rows.length > 0 && (
        <Card
          className={cn(
            'gap-0 overflow-hidden py-0 transition-opacity',
            isPlaceholderData && 'opacity-60',
          )}
          aria-busy={isPlaceholderData}
          data-test="users-table"
        >
          <DataTable
            columns={visibleColumns}
            rows={rows}
            rowKey={user => user.id}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
            <p className="text-sm text-muted-foreground tabular-nums">
              {t('users.count', { count: data.total })}
            </p>
            <ListPagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={page => setFilters({ page })}
            />
          </div>
        </Card>
      )}

      {dialogs}

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mailEnabled={capabilities?.mailEnabled ?? false}
        onCreate={createUser.mutateAsync}
      />
    </div>
  );
}

const SKELETON_ROWS = ['a', 'b', 'c', 'd', 'e', 'f'];

/** Placeholder rows shaped like the users table while the first page loads. */
function UsersTableSkeleton() {
  return (
    <Card className="gap-0 py-0" aria-hidden>
      {SKELETON_ROWS.map(row => (
        <div key={row} className="flex items-center gap-4 border-b px-4 py-3">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </Card>
  );
}
