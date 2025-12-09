import { useTranslation } from 'react-i18next';
import { ReportPeriod } from 'shared-schemas';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface ReportsHeaderProps {
  period: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
  apiaryName: string | undefined;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  period,
  onPeriodChange,
  apiaryName,
}) => {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
        {apiaryName && (
          <p className="text-muted-foreground mt-1">{apiaryName}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={period}
          onValueChange={(value) => onPeriodChange(value as ReportPeriod)}
        >
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4" />
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">{t('reports.periods.1month')}</SelectItem>
            <SelectItem value="3months">{t('reports.periods.3months')}</SelectItem>
            <SelectItem value="6months">{t('reports.periods.6months')}</SelectItem>
            <SelectItem value="ytd">{t('reports.periods.ytd')}</SelectItem>
            <SelectItem value="1year">{t('reports.periods.1year')}</SelectItem>
            <SelectItem value="all">{t('reports.periods.all')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
