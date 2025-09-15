import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useHarvests } from '@/api/hooks/useHarvests';
import { HarvestWizard } from './components/harvest-wizard';
import { format } from 'date-fns';
import { HarvestStatus } from 'shared-schemas';
import { useApiary } from '@/hooks/use-apiary';
import { Droplets, Calendar, Droplet, Package2 } from 'lucide-react';
import { useUnitFormat } from '@/hooks/use-unit-format';

export const HarvestListPage = () => {
  const navigate = useNavigate();
  const { activeApiaryId } = useApiary();
  const { data: harvests = [], isLoading } = useHarvests({
    apiaryId: activeApiaryId || undefined,
  });
  const { getWeightUnit } = useUnitFormat();

  const getStatusColor = (status: HarvestStatus) => {
    switch (status) {
      case HarvestStatus.DRAFT:
        return 'bg-gray-500';
      case HarvestStatus.IN_PROGRESS:
        return 'bg-yellow-500';
      case HarvestStatus.COMPLETED:
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: HarvestStatus) => {
    switch (status) {
      case HarvestStatus.DRAFT:
        return '📝';
      case HarvestStatus.IN_PROGRESS:
        return '⚙️';
      case HarvestStatus.COMPLETED:
        return '✅';
      default:
        return '';
    }
  };

  // Calculate statistics
  const totalHarvests = harvests.length;
  const completedHarvests = harvests.filter(
    h => h.status === HarvestStatus.COMPLETED,
  );
  const totalHoney = completedHarvests.reduce(
    (sum, h) => sum + (h.totalWeight || 0),
    0,
  );
  const averageHoney =
    completedHarvests.length > 0 ? totalHoney / completedHarvests.length : 0;

  if (isLoading) {
    return <div className="p-6">Loading harvests...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Harvests</h1>
          <p className="text-muted-foreground mt-1">
            Manage your honey harvests and track production
          </p>
        </div>
        <HarvestWizard />
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Harvests
            </CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHarvests}</div>
            <p className="text-xs text-muted-foreground">
              {completedHarvests.length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Honey</CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoney.toFixed(1)} {getWeightUnit()}</div>
            <p className="text-xs text-muted-foreground">
              From completed harvests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Yield</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageHoney.toFixed(1)} {getWeightUnit()}
            </div>
            <p className="text-xs text-muted-foreground">Per harvest</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Latest Harvest
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {harvests.length > 0
                ? format(new Date(harvests[0].date), 'MMM d')
                : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {harvests.length > 0 && harvests[0].totalWeight
                ? `${harvests[0].totalWeight} ${harvests[0].totalWeightUnit || getWeightUnit()}`
                : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Harvests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Harvest History</CardTitle>
        </CardHeader>
        <CardContent>
          {harvests.length === 0 ? (
            <div className="text-center py-12">
              <Droplets className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No harvests yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your honey harvests to see production statistics
              </p>
              <HarvestWizard />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hives</TableHead>
                  <TableHead>Frames</TableHead>
                  <TableHead>Honey ({getWeightUnit()})</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {harvests.map(harvest => (
                  <TableRow
                    key={harvest.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/harvests/${harvest.id}`)}
                  >
                    <TableCell>
                      {format(new Date(harvest.date), 'PPP')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          getStatusColor(harvest.status),
                          'text-white',
                        )}
                      >
                        {getStatusIcon(harvest.status)} {harvest.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{harvest.hiveCount}</TableCell>
                    <TableCell>{harvest.totalFrames}</TableCell>
                    <TableCell>
                      {harvest.totalWeight
                        ? `${harvest.totalWeight.toFixed(1)} ${harvest.totalWeightUnit || getWeightUnit()}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/harvests/${harvest.id}`);
                        }}
                      >
                        View
                      </Button>
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

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
