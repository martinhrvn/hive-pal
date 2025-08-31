import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Clock } from 'lucide-react';
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
      <div className="text-sm text-muted-foreground mb-4">
        {t('common:loading')}...
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="space-y-2">
        {overdueCount > 0 && (
          <div 
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 cursor-pointer"
            onClick={handleViewOverdue}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>
              {overdueCount} {t('inspection:dashboard.overdue', 'overdue')}
            </span>
          </div>
        )}
        
        {dueTodayCount > 0 && (
          <div 
            className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 cursor-pointer"
            onClick={handleViewDueToday}
          >
            <Clock className="h-4 w-4" />
            <span>
              {dueTodayCount} {t('inspection:dashboard.dueToday', 'due today')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};