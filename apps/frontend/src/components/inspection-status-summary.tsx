import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Clock, Calendar, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOverdueInspections, useDueTodayInspections } from '@/api/hooks/useInspections';

export const InspectionStatusSummary: React.FC = () => {
  const { t } = useTranslation(['inspection', 'common']);
  const navigate = useNavigate();
  
  const { data: overdueInspections, isLoading: overdueLoading } = useOverdueInspections();
  const { data: dueTodayInspections, isLoading: dueTodayLoading } = useDueTodayInspections();

  const isLoading = overdueLoading || dueTodayLoading;
  const overdueCount = overdueInspections?.length ?? 0;
  const dueTodayCount = dueTodayInspections?.length ?? 0;

  // Don't show anything if there are no inspections to display
  if (!isLoading && overdueCount === 0 && dueTodayCount === 0) {
    return null;
  }

  const handleViewOverdue = () => {
    navigate('/inspections?status=OVERDUE');
  };

  const handleViewDueToday = () => {
    navigate('/inspections?status=SCHEDULED&date=' + new Date().toISOString().split('T')[0]);
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('inspection:dashboard.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t('common:loading')}...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('inspection:dashboard.title', 'Inspection Status')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Overdue Inspections */}
          {overdueCount > 0 && (
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="font-medium text-red-900 dark:text-red-100">
                    {t('inspection:dashboard.overdue', 'Overdue')}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-200">
                    {t('inspection:dashboard.overdueCount', 
                      '{{count}} inspection{{count, plural, one {} other{s}}} overdue',
                      { count: overdueCount }
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{overdueCount}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewOverdue}
                  className="border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {t('common:view')}
                </Button>
              </div>
            </div>
          )}

          {/* Due Today Inspections */}
          {dueTodayCount > 0 && (
            <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium text-orange-900 dark:text-orange-100">
                    {t('inspection:dashboard.dueToday', 'Due Today')}
                  </div>
                  <div className="text-sm text-orange-700 dark:text-orange-200">
                    {t('inspection:dashboard.dueTodayCount', 
                      '{{count}} inspection{{count, plural, one {} other{s}}} due today',
                      { count: dueTodayCount }
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-500 hover:bg-orange-600">{dueTodayCount}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewDueToday}
                  className="border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/30"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {t('common:view')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};