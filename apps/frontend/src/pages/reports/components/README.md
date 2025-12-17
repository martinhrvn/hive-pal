# Reports Page Components

This directory contains the components for the Reports page in Hive Pal.

## Components

### StatisticsCards

Summary cards displaying key metrics for the selected apiary and period.

**Props:**
- `statistics: ApiaryStatistics | undefined` - The apiary statistics data
- `isLoading: boolean` - Loading state

**Features:**
- Displays 4 key metrics:
  1. Total Honey Production (kg)
  2. Total Sugar Fed (kg)
  3. Average Health Score (0-10 scale)
  4. Active Hives count
- Each card has an icon and color-coded value
- Skeleton loading states
- Responsive grid layout (2 columns on mobile, 4 on desktop)
- Handles missing data with "—" placeholder

**Icons:**
- Droplets (amber) - Honey production
- Cookie (orange) - Feeding totals
- Heart (red) - Health scores
- Home (green) - Active hives

### HoneyProductionChart

Bar chart showing total honey production per hive using Recharts.

**Props:**
- `data: Array<{ hiveId: string; hiveName: string; amount: number }> | undefined` - Per-hive honey data
- `isLoading: boolean` - Loading state

**Features:**
- Bar chart with hive names on X-axis, honey amount (kg) on Y-axis
- Responsive ChartContainer from shadcn/ui
- Tooltip showing hive name and exact amount
- Skeleton loading state
- Empty state with "No data available" message
- Amber color theme (#f59e0b) for bars

### FeedingTotalsChart

Bar chart showing total sugar fed per hive using Recharts.

**Props:**
- `data: Array<{ hiveId: string; hiveName: string; sugarKg: number }> | undefined` - Per-hive feeding data
- `isLoading: boolean` - Loading state

**Features:**
- Bar chart with hive names on X-axis, sugar amount (kg) on Y-axis
- Responsive ChartContainer from shadcn/ui
- Tooltip showing hive name and exact amount
- Skeleton loading state
- Empty state with "No data available" message
- Orange color theme (#ea580c) for bars

### HiveComparisonTable

A sortable data table showing per-hive metrics for comparison.

**Props:**
- `statistics: ApiaryStatistics | undefined` - The apiary statistics data
- `isLoading: boolean` - Loading state

**Features:**
- Sortable columns (click column headers to sort)
- Color-coded health scores:
  - Green (≥7): Good health
  - Yellow (≥4): Fair health
  - Red (<4): Poor health
- Formatted dates
- Handles missing data gracefully with "-" or "N/A"

**Columns:**
1. Hive Name
2. Honey (kg) - total honey production
3. Sugar Fed (kg) - total sugar feeding
4. Health Score (0-10) - color-coded overall health
5. Last Inspection - formatted date or "N/A"

### ReportsHeader

Page header with title, apiary name, and period selector.

**Props:**
- `period: ReportPeriod` - Current selected period
- `onPeriodChange: (period: ReportPeriod) => void` - Period change handler
- `apiaryName: string | undefined` - Name of the active apiary

**Features:**
- Displays report title
- Shows apiary name (if available)
- Period selector dropdown with icon
- Responsive layout (stacks on mobile)

### ReportsSidebar

Action sidebar with filters and export options.

**Props:**
- `period: ReportPeriod` - Current selected period
- `onPeriodChange: (period: ReportPeriod) => void` - Period change handler
- `onExportCsv: () => void` - CSV export handler
- `onExportPdf: () => void` - PDF export handler
- `onRefresh: () => void` - Refresh data handler
- `isExporting?: boolean` - Optional export loading state

**Features:**
- Period filter section
- Export section (CSV and PDF buttons)
- Refresh button
- Uses ActionSidebarContainer pattern
- Organized into logical sections

## Usage Example

Here's how to integrate these components into the reports page:

```typescript
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportPeriod } from 'shared-schemas';
import { MainContent, Page, Sidebar } from '@/components/layout/page-grid-layout';
import { useApiaryStore } from '@/hooks/use-apiary';
import { useApiary } from '@/hooks/use-apiary';
import { useApiaryStatistics } from '@/api/hooks/useReports';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  StatisticsCards,
  HiveComparisonTable,
  ReportsHeader,
  ReportsSidebar,
} from './components';
import {
  HoneyProductionChart,
  FeedingTotalsChart,
} from './components/charts';

export const ReportsPage = () => {
  const { t } = useTranslation('common');
  const [period, setPeriod] = useState<ReportPeriod>('ytd');
  const { activeApiaryId } = useApiaryStore();
  const { activeApiary } = useApiary();

  const {
    data: statistics,
    isLoading,
    refetch
  } = useApiaryStatistics(activeApiaryId || undefined, period);

  const handleExportCsv = () => {
    // TODO: Implement CSV export
    console.log('Export CSV');
  };

  const handleExportPdf = () => {
    // TODO: Implement PDF export
    console.log('Export PDF');
  };

  const handleRefresh = () => {
    refetch();
  };

  if (!activeApiaryId) {
    return (
      <Page>
        <MainContent>
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t('reports.selectApiary')}
            </CardContent>
          </Card>
        </MainContent>
      </Page>
    );
  }

  return (
    <Page>
      <MainContent>
        <div className="space-y-6">
          <ReportsHeader
            period={period}
            onPeriodChange={setPeriod}
            apiaryName={activeApiary?.name}
          />

          <StatisticsCards
            statistics={statistics}
            isLoading={isLoading}
          />

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">{t('reports.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="comparison">{t('reports.tabs.comparison')}</TabsTrigger>
              <TabsTrigger value="trends">{t('reports.tabs.trends')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <HoneyProductionChart
                data={statistics?.honeyProduction.byHive}
                isLoading={isLoading}
              />
              <FeedingTotalsChart
                data={statistics?.feedingTotals.byHive}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="comparison">
              <HiveComparisonTable
                statistics={statistics}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="trends">
              {/* Trend charts will go here */}
            </TabsContent>
          </Tabs>
        </div>
      </MainContent>

      <Sidebar>
        <ReportsSidebar
          period={period}
          onPeriodChange={setPeriod}
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
          onRefresh={handleRefresh}
        />
      </Sidebar>
    </Page>
  );
};
```

## Translations

All translations are located in `apps/frontend/public/locales/en/common.json` under the `reports` key:

```json
{
  "reports": {
    "title": "Reports",
    "selectApiary": "Select an apiary to view reports",
    "tabs": {
      "overview": "Overview",
      "comparison": "Hive Comparison",
      "trends": "Trends"
    },
    "periods": {
      "1month": "1 Month",
      "3months": "3 Months",
      "6months": "6 Months",
      "ytd": "Year to Date",
      "1year": "1 Year",
      "all": "All Time"
    },
    "filters": {
      "period": "Period"
    },
    "export": {
      "title": "Export",
      "csv": "Export as CSV",
      "pdf": "Export as PDF"
    }
  }
}
```

## Data Types

The components use types from `shared-schemas`:

- `ApiaryStatistics` - Main statistics response with honey, feeding, and health data
- `ReportPeriod` - Period enum: '1month' | '3months' | '6months' | 'ytd' | '1year' | 'all'
- `HiveHoney` - Per-hive honey production data
- `HiveFeeding` - Per-hive feeding data
- `HiveHealth` - Per-hive health scores and inspection data

## API Hooks

- `useApiaryStatistics(apiaryId, period)` - Fetches statistics for the given period
- `useApiaryTrends(apiaryId, period)` - Fetches trend data (for future charts)

## Styling

All components use:
- Tailwind CSS classes
- shadcn/ui components (Table, Select, Button, Card)
- Lucide React icons
- Responsive design patterns
- Dark mode support via Tailwind dark: prefix
