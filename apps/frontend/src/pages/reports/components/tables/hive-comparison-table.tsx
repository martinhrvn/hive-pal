import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ApiaryStatistics } from 'shared-schemas';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HiveComparisonTableProps {
  statistics: ApiaryStatistics | undefined;
  isLoading: boolean;
}

type SortField = 'hiveName' | 'honey' | 'sugar' | 'healthScore' | 'lastInspection';
type SortDirection = 'asc' | 'desc';

const getHealthScoreColor = (score: number | null): string => {
  if (score === null) return 'text-muted-foreground';
  if (score >= 7) return 'text-green-600 dark:text-green-400';
  if (score >= 4) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const HiveComparisonTable: React.FC<HiveComparisonTableProps> = ({
  statistics,
  isLoading,
}) => {
  const { t } = useTranslation('common');
  const [sortField, setSortField] = useState<SortField>('hiveName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.tabs.comparison')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {t('status.loading')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics || !statistics.honeyProduction.byHive.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.tabs.comparison')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {t('messages.noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Combine data from different sources by hive
  const combinedData = statistics.honeyProduction.byHive.map((honeyData) => {
    const feedingData = statistics.feedingTotals.byHive.find(
      (f) => f.hiveId === honeyData.hiveId
    );
    const healthData = statistics.healthScores.byHive.find(
      (h) => h.hiveId === honeyData.hiveId
    );

    return {
      hiveId: honeyData.hiveId,
      hiveName: honeyData.hiveName,
      honey: honeyData.amount,
      sugar: feedingData?.sugarKg || 0,
      healthScore: healthData?.overallScore || null,
      lastInspectionDate: healthData?.lastInspectionDate || null,
    };
  });

  // Sort data
  const sortedData = [...combinedData].sort((a, b) => {
    let aValue: string | number | null;
    let bValue: string | number | null;

    switch (sortField) {
      case 'hiveName':
        aValue = a.hiveName;
        bValue = b.hiveName;
        break;
      case 'honey':
        aValue = a.honey;
        bValue = b.honey;
        break;
      case 'sugar':
        aValue = a.sugar;
        bValue = b.sugar;
        break;
      case 'healthScore':
        aValue = a.healthScore ?? -1;
        bValue = b.healthScore ?? -1;
        break;
      case 'lastInspection':
        aValue = a.lastInspectionDate ? new Date(a.lastInspectionDate).getTime() : 0;
        bValue = b.lastInspectionDate ? new Date(b.lastInspectionDate).getTime() : 0;
        break;
      default:
        aValue = a.hiveName;
        bValue = b.hiveName;
    }

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const SortableHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <TableHead>
      <button
        onClick={() => handleSort(field)}
        className="flex items-center gap-2 hover:text-foreground transition-colors"
      >
        {children}
        <ArrowUpDown
          className={cn(
            'h-4 w-4',
            sortField === field ? 'opacity-100' : 'opacity-30'
          )}
        />
      </button>
    </TableHead>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.tabs.comparison')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader field="hiveName">Hive Name</SortableHeader>
              <SortableHeader field="honey">
                Honey ({statistics.honeyProduction.unit})
              </SortableHeader>
              <SortableHeader field="sugar">Sugar Fed (kg)</SortableHeader>
              <SortableHeader field="healthScore">Health Score</SortableHeader>
              <SortableHeader field="lastInspection">
                Last Inspection
              </SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row) => (
              <TableRow key={row.hiveId}>
                <TableCell className="font-medium">{row.hiveName}</TableCell>
                <TableCell>{row.honey.toFixed(1)}</TableCell>
                <TableCell>{row.sugar.toFixed(1)}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'font-medium',
                      getHealthScoreColor(row.healthScore)
                    )}
                  >
                    {row.healthScore !== null
                      ? row.healthScore.toFixed(1)
                      : '-'}
                  </span>
                </TableCell>
                <TableCell>{formatDate(row.lastInspectionDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
