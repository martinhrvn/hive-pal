import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useIsAdmin } from '@/hooks/use-is-admin.ts';
import { useUserDetailedStats } from '@/api/hooks/useAdminUsers';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Alert } from '@/components/ui/alert.tsx';
import { ArrowLeft } from 'lucide-react';

const UserDetailPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const { id } = useParams<{ id: string }>();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useUserDetailedStats(id);

  // Check if user is admin, otherwise redirect
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return t('status.dash');
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center py-8">{t('messages.loading')}</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">{t('messages.failedToFetch')}</Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/admin/users')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('userDetail.backToList')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('userDetail.backToList')}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{stats.userName || stats.email}</h1>
          <p className="text-muted-foreground">{stats.email}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('userDetail.summary.totalApiaries')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.summary.totalApiaries}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('userDetail.summary.totalHives')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.summary.totalHives}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('userDetail.summary.totalInspections')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.summary.totalInspections}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('userDetail.summary.lastActivity')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">
              {formatDate(stats.summary.lastActivityDate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('userDetail.summary.lastInspection')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">
              {formatDate(stats.summary.lastInspectionDate)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('userDetail.recentActivity.title')}</CardTitle>
          <CardDescription>
            {t('userDetail.recentActivity.period')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {t('userDetail.recentActivity.inspections')}
              </p>
              <p className="text-2xl font-bold">
                {stats.recentActivity.inspectionsCount}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {t('userDetail.recentActivity.actions')}
              </p>
              <p className="text-2xl font-bold">
                {stats.recentActivity.actionsCount}
              </p>
            </div>
          </div>

          {stats.recentActivity.actionsByType.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">
                {t('userDetail.recentActivity.byType')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {stats.recentActivity.actionsByType.map(action => (
                  <div
                    key={action.type}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                  >
                    {action.type}: {action.count}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Apiary Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t('userDetail.apiaryBreakdown.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.apiaryBreakdown.length === 0 ? (
            <p className="text-muted-foreground py-4">
              {t('userDetail.apiaryBreakdown.noApiaries')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('userDetail.apiaryBreakdown.name')}</TableHead>
                  <TableHead>{t('userDetail.apiaryBreakdown.location')}</TableHead>
                  <TableHead>{t('userDetail.apiaryBreakdown.coordinates')}</TableHead>
                  <TableHead className="text-center">
                    {t('userDetail.apiaryBreakdown.hives')}
                  </TableHead>
                  <TableHead className="text-center">
                    {t('userDetail.apiaryBreakdown.inspections')}
                  </TableHead>
                  <TableHead>
                    {t('userDetail.apiaryBreakdown.lastInspection')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.apiaryBreakdown.map(apiary => (
                  <TableRow key={apiary.apiaryId}>
                    <TableCell className="font-medium">
                      {apiary.apiaryName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {apiary.apiaryLocation || t('status.dash')}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {apiary.latitude && apiary.longitude
                        ? `${apiary.latitude.toFixed(4)}, ${apiary.longitude.toFixed(4)}`
                        : t('status.dash')}
                    </TableCell>
                    <TableCell className="text-center">
                      {apiary.hivesCount}
                    </TableCell>
                    <TableCell className="text-center">
                      {apiary.inspectionsCount}
                    </TableCell>
                    <TableCell>
                      {formatDate(apiary.lastInspectionDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDetailPage;
