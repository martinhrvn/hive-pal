import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin } from 'lucide-react';
import type { AdminUser, UserDetailedStats } from 'shared-schemas';
import { useAdminUser, useUserDetailedStats } from '@/api/hooks/useAdminUsers';
import { useAuth } from '@/context/auth-context';
import { Metric } from '@/components/common/metric';
import { StatusPill } from '@/components/common/status-pill';
import { IconBadge } from '@/components/dashboard/empty-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { actionTypeKey } from '@/utils/action-type';
import { DateCell } from '../user-management/date-cell';
import { UserActionsMenu } from '../user-management/user-actions-menu';
import { useUserActions } from '../user-management/use-user-actions';
import { RolePill, UserStatusPill } from '../user-management/user-pills';

const NUMERIC = 'text-right tabular-nums';

export default function UserDetailPage() {
  const { t } = useTranslation('admin');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const stats = useUserDetailedStats(id);
  const account = useAdminUser(id);
  const { openAction, dialogs } = useUserActions({
    onDeleted: () => navigate('/admin/users'),
  });

  if (stats.isLoading || account.isLoading) return <UserDetailSkeleton />;

  if (!stats.data || !account.data) {
    return (
      <div className="container mx-auto space-y-4 py-6">
        <Alert variant="destructive">
          <AlertDescription>{t('messages.failedToFetch')}</AlertDescription>
        </Alert>
        <BackToUsers />
      </div>
    );
  }

  const user = account.data;
  return (
    <div className="container mx-auto space-y-8 py-6">
      <header className="flex flex-wrap items-start gap-4">
        <BackToUsers />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h1 className="text-2xl font-bold">{user.name || user.email}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <AccountFacts user={user} />
        </div>
        <UserActionsMenu
          user={user}
          isSelf={user.id === currentUser?.id}
          onSelect={openAction}
        />
      </header>

      <SummaryMetrics stats={stats.data} />
      <RecentActivityCard activity={stats.data.recentActivity} />
      <ApiaryBreakdownCard apiaries={stats.data.apiaryBreakdown} />
      {dialogs}
    </div>
  );
}

function BackToUsers() {
  const { t } = useTranslation('admin');
  return (
    <Button variant="outline" size="sm" asChild>
      <Link to="/admin/users">
        <ArrowLeft className="size-4" aria-hidden />
        {t('userDetail.backToList')}
      </Link>
    </Button>
  );
}

function AccountFacts({ user }: Readonly<{ user: AdminUser }>) {
  const { t } = useTranslation('admin');
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
      <RolePill role={user.role} />
      <UserStatusPill user={user} />
      <span>
        {t('users.detail.lastLogin')}{' '}
        <DateCell
          value={user.lastLoginAt}
          withTime
          fallback={t('users.table.never')}
        />
      </span>
      <span>
        {t('users.detail.memberSince')} <DateCell value={user.createdAt} />
      </span>
      {user.banned && user.banReason && (
        <span>{t('users.detail.banReason', { reason: user.banReason })}</span>
      )}
    </div>
  );
}

function SummaryMetrics({ stats }: Readonly<{ stats: UserDetailedStats }>) {
  const { t } = useTranslation('admin');
  const { summary } = stats;
  const metrics = [
    { id: 'apiaries', label: 'totalApiaries', value: summary.totalApiaries },
    { id: 'hives', label: 'totalHives', value: summary.totalHives },
    {
      id: 'inspections',
      label: 'totalInspections',
      value: summary.totalInspections,
    },
    {
      id: 'activity',
      label: 'lastActivity',
      value: <DateCell value={summary.lastActivityDate} />,
    },
    {
      id: 'inspection',
      label: 'lastInspection',
      value: <DateCell value={summary.lastInspectionDate} />,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {metrics.map(metric => (
        <Card key={metric.id} className="@container py-5">
          <CardContent>
            <Metric
              size="lg"
              label={t(`userDetail.summary.${metric.label}`)}
              value={metric.value}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecentActivityCard({
  activity,
}: Readonly<{ activity: UserDetailedStats['recentActivity'] }>) {
  const { t } = useTranslation(['admin', 'common']);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('userDetail.recentActivity.title')}</CardTitle>
        <CardDescription>
          {t('userDetail.recentActivity.period')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-10">
          <Metric
            label={t('userDetail.recentActivity.inspections')}
            value={activity.inspectionsCount}
          />
          <Metric
            label={t('userDetail.recentActivity.actions')}
            value={activity.actionsCount}
          />
        </div>
        {activity.actionsByType.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-overline text-muted-foreground">
              {t('userDetail.recentActivity.byType')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {activity.actionsByType.map(action => (
                <StatusPill key={action.type}>
                  {t(`common:actionTypes.${actionTypeKey(action.type)}`, {
                    defaultValue: action.type,
                  })}
                  <span className="tabular-nums text-foreground">
                    {action.count}
                  </span>
                </StatusPill>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ApiaryBreakdownCard({
  apiaries,
}: Readonly<{ apiaries: UserDetailedStats['apiaryBreakdown'] }>) {
  const { t, i18n } = useTranslation('admin');
  const coordinate = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
    [i18n.language],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('userDetail.apiaryBreakdown.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {apiaries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <IconBadge>
              <MapPin />
            </IconBadge>
            <p className="text-muted-foreground">
              {t('userDetail.apiaryBreakdown.noApiaries')}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('userDetail.apiaryBreakdown.name')}</TableHead>
                <TableHead>
                  {t('userDetail.apiaryBreakdown.location')}
                </TableHead>
                <TableHead>
                  {t('userDetail.apiaryBreakdown.coordinates')}
                </TableHead>
                <TableHead className="text-right">
                  {t('userDetail.apiaryBreakdown.hives')}
                </TableHead>
                <TableHead className="text-right">
                  {t('userDetail.apiaryBreakdown.inspections')}
                </TableHead>
                <TableHead>
                  {t('userDetail.apiaryBreakdown.lastInspection')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiaries.map(apiary => (
                <TableRow key={apiary.apiaryId}>
                  <TableCell className="font-medium">
                    {apiary.apiaryName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {apiary.apiaryLocation || t('status.dash')}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {apiary.latitude != null && apiary.longitude != null
                      ? `${coordinate.format(apiary.latitude)}, ${coordinate.format(apiary.longitude)}`
                      : t('status.dash')}
                  </TableCell>
                  <TableCell className={NUMERIC}>{apiary.hivesCount}</TableCell>
                  <TableCell className={NUMERIC}>
                    {apiary.inspectionsCount}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <DateCell value={apiary.lastInspectionDate} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

const SKELETON_CARDS = ['a', 'b', 'c', 'd', 'e'];

/** Placeholder shaped like the detail page while the user loads. */
function UserDetailSkeleton() {
  return (
    <div className="container mx-auto space-y-8 py-6" aria-hidden>
      <div className="flex items-start gap-4">
        <Skeleton className="h-8 w-32" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {SKELETON_CARDS.map(card => (
          <Skeleton key={card} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}
