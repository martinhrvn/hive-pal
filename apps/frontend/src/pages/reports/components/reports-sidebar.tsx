import { useTranslation } from 'react-i18next';
import { ReportPeriod } from 'shared-schemas';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ActionSidebarContainer,
  ActionSidebarGroup,
} from '@/components/sidebar';
import { SidebarMenuItem } from '@/components/ui/sidebar';
import { Calendar, Download, FileText, RefreshCw } from 'lucide-react';

interface ReportsSidebarProps {
  period: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
  onRefresh: () => void;
  isExporting?: boolean;
}

export const ReportsSidebar: React.FC<ReportsSidebarProps> = ({
  period,
  onPeriodChange,
  onExportCsv,
  onExportPdf,
  onRefresh,
  isExporting = false,
}) => {
  const { t } = useTranslation('common');

  return (
    <ActionSidebarContainer>
      <div className="space-y-4">
        {/* Period Filter Section */}
        <ActionSidebarGroup title={t('reports.filters.period')}>
          <SidebarMenuItem>
            <div className="w-full">
              <Select
                value={period}
                onValueChange={(value) => onPeriodChange(value as ReportPeriod)}
              >
                <SelectTrigger className="w-full">
                  <Calendar className="h-4 w-4" />
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">
                    {t('reports.periods.1month')}
                  </SelectItem>
                  <SelectItem value="3months">
                    {t('reports.periods.3months')}
                  </SelectItem>
                  <SelectItem value="6months">
                    {t('reports.periods.6months')}
                  </SelectItem>
                  <SelectItem value="ytd">
                    {t('reports.periods.ytd')}
                  </SelectItem>
                  <SelectItem value="1year">
                    {t('reports.periods.1year')}
                  </SelectItem>
                  <SelectItem value="all">
                    {t('reports.periods.all')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SidebarMenuItem>
        </ActionSidebarGroup>

        {/* Export Section */}
        <ActionSidebarGroup title={t('reports.export.title')}>
          <SidebarMenuItem>
            <div className="w-full space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={onExportCsv}
                disabled={isExporting}
              >
                <FileText className="h-4 w-4" />
                {t('reports.export.csv')}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={onExportPdf}
                disabled={isExporting}
              >
                <Download className="h-4 w-4" />
                {t('reports.export.pdf')}
              </Button>
            </div>
          </SidebarMenuItem>
        </ActionSidebarGroup>

        {/* Actions Section */}
        <ActionSidebarGroup title={t('actions.actions')}>
          <SidebarMenuItem>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4" />
              {t('actions.refresh')}
            </Button>
          </SidebarMenuItem>
        </ActionSidebarGroup>
      </div>
    </ActionSidebarContainer>
  );
};
