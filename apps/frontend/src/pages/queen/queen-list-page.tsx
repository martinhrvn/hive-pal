import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueens, useHives } from '@/api/hooks';
import { QueenTable } from './components/queen-table';
import { QueenResponse } from 'shared-schemas';

const QueenListContent: React.FC<{
  queens?: QueenResponse[];
  isLoading: boolean;
}> = ({ queens, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!queens || queens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Crown className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No queens found.</p>
        <Button asChild className="mt-4" size="sm">
          <Link to="/queens/create">Add your first queen</Link>
        </Button>
      </div>
    );
  }

  return <QueenTable queens={queens} showHive />;
};

export const QueenListPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hiveFilter, setHiveFilter] = useState<string>('all');

  const { data: hives } = useHives();
  const { data: queens, isLoading } = useQueens({
    status: statusFilter === 'all' ? undefined : statusFilter,
    hiveId: hiveFilter === 'all' ? undefined : hiveFilter,
  });

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Crown className="h-6 w-6 text-amber-500" />
          Queens
        </h1>
        <Button asChild size="sm">
          <Link to="/queens/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Queen
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="REPLACED">Replaced</SelectItem>
                  <SelectItem value="DEAD">Dead</SelectItem>
                  <SelectItem value="UNKNOWN">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={hiveFilter} onValueChange={setHiveFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Hive" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hives</SelectItem>
                  {hives?.map(hive => (
                    <SelectItem key={hive.id} value={hive.id}>
                      {hive.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <QueenListContent queens={queens} isLoading={isLoading} />
    </div>
  );
};
