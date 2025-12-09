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

type SortField =
  | 'hiveName'
  | 'honey'
  | 'sugar'
  | 'overallScore'
  | 'populationScore'
  | 'storesScore'
  | 'queenScore'
  | 'lastInspection';
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

const formatScore = (score: number | null): string => {
  if (score === null) return '-';
  return score.toFixed(1);
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
          <CardTitle>{t('reports.hiveComparison')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {t('status.loading')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics || !statistics.healthScores.byHive.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.hiveComparison')}</CardTitle>
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
      setSortDirection('desc'); // Default to desc for scores (highest first)
    }
  };

  // Combine data from different sources by hive
  const combinedData = statistics.healthScores.byHive.map((healthData) => {
    const honeyData = statistics.honeyProduction.byHive.find(
      (h) => h.hiveId === healthData.hiveId
    );
    const feedingData = statistics.feedingTotals.byHive.find(
      (f) => f.hiveId === healthData.hiveId
    );

    return {
      hiveId: healthData.hiveId,
      hiveName: healthData.hiveName,
      honey: honeyData?.amount || 0,
      sugar: feedingData?.sugarKg || 0,
      overallScore: healthData.overallScore,
      populationScore: healthData.populationScore,
      storesScore: healthData.storesScore,
      queenScore: healthData.queenScore,
      lastInspectionDate: healthData.lastInspectionDate,
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
      case 'overallScore':
        aValue = a.overallScore ?? -1;
        bValue = b.overallScore ?? -1;
        break;
      case 'populationScore':
        aValue = a.populationScore ?? -1;
        bValue = b.populationScore ?? -1;
        break;
      case 'storesScore':
        aValue = a.storesScore ?? -1;
        bValue = b.storesScore ?? -1;
        break;
      case 'queenScore':
        aValue = a.queenScore ?? -1;
        bValue = b.queenScore ?? -1;
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
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead className={className}>
      <button
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {children}
        <ArrowUpDown
          className={cn(
            'h-3 w-3',
            sortField === field ? 'opacity-100' : 'opacity-30'
          )}
        />
      </button>
    </TableHead>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.hiveComparison')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="hiveName">{t('reports.table.hiveName')}</SortableHeader>
                <SortableHeader field="honey" className="text-right">
                  {t('reports.table.honey')}
                </SortableHeader>
                <SortableHeader field="sugar" className="text-right">
                  {t('reports.table.sugarFed')}
                </SortableHeader>
                <SortableHeader field="overallScore" className="text-right">
                  {t('reports.table.overall')}
                </SortableHeader>
                <SortableHeader field="populationScore" className="text-right">
                  {t('reports.table.population')}
                </SortableHeader>
                <SortableHeader field="storesScore" className="text-right">
                  {t('reports.table.stores')}
                </SortableHeader>
                <SortableHeader field="queenScore" className="text-right">
                  {t('reports.table.queen')}
                </SortableHeader>
                <SortableHeader field="lastInspection">
                  {t('reports.table.lastInspection')}
                </SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row) => (
                <TableRow key={row.hiveId}>
                  <TableCell className="font-medium">{row.hiveName}</TableCell>
                  <TableCell className="text-right">{row.honey.toFixed(1)} kg</TableCell>
                  <TableCell className="text-right">{row.sugar.toFixed(1)} kg</TableCell>
                  <TableCell className="text-right">
                    <span className={cn('font-medium', getHealthScoreColor(row.overallScore))}>
                      {formatScore(row.overallScore)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn('font-medium', getHealthScoreColor(row.populationScore))}>
                      {formatScore(row.populationScore)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn('font-medium', getHealthScoreColor(row.storesScore))}>
                      {formatScore(row.storesScore)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn('font-medium', getHealthScoreColor(row.queenScore))}>
                      {formatScore(row.queenScore)}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(row.lastInspectionDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
