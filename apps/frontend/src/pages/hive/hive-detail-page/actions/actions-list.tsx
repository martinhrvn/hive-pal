import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActions } from '@/api/hooks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ActionResponse, ActionType } from 'shared-schemas';
import { Input } from '@/components/ui/input';
import { Calendar, ExternalLink } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid } from 'date-fns';
import { Link } from 'react-router-dom';
import { AddActionDialog } from './add-action-dialog';

export const ActionsList = ({ hiveId }: { hiveId: string }) => {
  const [selectedType, setSelectedType] = useState<ActionType | 'all'>('all');
  const [dateRange, setDateRange] = useState<{
    startDate: string | undefined;
    endDate: string | undefined;
  }>({
    startDate: undefined,
    endDate: undefined,
  });

  const { data: actions, isLoading } = useActions({
    hiveId,
    type: selectedType === 'all' ? undefined : selectedType,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
    } catch (e: unknown) {
      console.error('Error parsing date:', e);
      return 'Invalid date';
    }
  };

  const getActionTypeColor = (type: ActionType) => {
    switch (type) {
      case ActionType.FEEDING:
        return 'bg-amber-100 text-amber-800';
      case ActionType.TREATMENT:
        return 'bg-blue-100 text-blue-800';
      case ActionType.FRAME:
        return 'bg-green-100 text-green-800';
      case ActionType.OTHER:
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderActionDetails = (action: ActionResponse) => {
    switch (action.details.type) {
      case ActionType.FEEDING:
        return (
          <div>
            <p>
              <span className="font-medium">Feed Type:</span>{' '}
              {action.details.feedType}
            </p>
            <p>
              <span className="font-medium">Amount:</span>{' '}
              {action.details.amount} {action.details.unit}
            </p>
            {action.details.concentration && (
              <p>
                <span className="font-medium">Concentration:</span>{' '}
                {action.details.concentration}
              </p>
            )}
          </div>
        );
      case ActionType.TREATMENT:
        return (
          <div>
            <p>
              <span className="font-medium">Product:</span>{' '}
              {action.details.product}
            </p>
            <p>
              <span className="font-medium">Quantity:</span>{' '}
              {action.details.quantity} {action.details.unit}
            </p>
            {action.details.duration && (
              <p>
                <span className="font-medium">Duration:</span>{' '}
                {action.details.duration}
              </p>
            )}
          </div>
        );
      case ActionType.FRAME:
        return (
          <div>
            <p>
              <span className="font-medium">Frames:</span>{' '}
              {action.details.quantity > 0
                ? `Added ${action.details.quantity} frame(s)`
                : `Removed ${Math.abs(action.details.quantity)} frame(s)`}
            </p>
          </div>
        );
      case ActionType.OTHER:
      default:
        return action.notes ? (
          <p>{action.notes}</p>
        ) : (
          <p>No details provided</p>
        );
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2">
          <CardTitle className="text-lg">Actions History</CardTitle>
          <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <AddActionDialog hiveId={hiveId} />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-dashed gap-1 text-xs sm:text-sm"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {dateRange.startDate || dateRange.endDate ? (
                    <span>
                      {dateRange.startDate
                        ? formatDate(dateRange.startDate)
                        : 'Start'}
                      {' - '}
                      {dateRange.endDate
                        ? formatDate(dateRange.endDate)
                        : 'End'}
                    </span>
                  ) : (
                    <span>All dates</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-full p-0"
                style={{ width: '300px' }}
              >
                <div className="p-3">
                  <div className="space-y-3">
                    <div className="grid gap-2">
                      <div className="grid gap-1">
                        <label className="text-sm font-medium">
                          Start Date
                        </label>
                        <Input
                          type="date"
                          value={dateRange.startDate?.split('T')[0] || ''}
                          onChange={e => {
                            const value = e.target.value;
                            setDateRange(prev => ({
                              ...prev,
                              startDate: value
                                ? `${value}T00:00:00Z`
                                : undefined,
                            }));
                          }}
                        />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-sm font-medium">End Date</label>
                        <Input
                          type="date"
                          value={dateRange.endDate?.split('T')[0] || ''}
                          onChange={e => {
                            const value = e.target.value;
                            setDateRange(prev => ({
                              ...prev,
                              endDate: value ? `${value}T23:59:59Z` : undefined,
                            }));
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setDateRange({
                            startDate: undefined,
                            endDate: undefined,
                          })
                        }
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Select
              value={selectedType}
              onValueChange={value =>
                setSelectedType(value as ActionType | 'all')
              }
            >
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value={ActionType.FEEDING}>Feeding</SelectItem>
                <SelectItem value={ActionType.TREATMENT}>Treatment</SelectItem>
                <SelectItem value={ActionType.FRAME}>Frame</SelectItem>
                <SelectItem value={ActionType.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-pulse flex space-x-4">
                <div className="space-y-2 w-full">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ) : actions && actions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map(action => (
                  <TableRow key={action.id}>
                    <TableCell>
                      <Badge className={getActionTypeColor(action.type)}>
                        {action.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{renderActionDetails(action)}</TableCell>
                    <TableCell>
                      {action.notes || (
                        <span className="text-muted-foreground italic">
                          No notes
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {action.inspectionId ? (
                        <Link to={`/inspections/${action.inspectionId}`}>
                          <div className="text-right cursor-pointer hover:underline flex items-center justify-end space-x-1">
                            <span>{formatDate(action.date)}</span>
                            <ExternalLink size={14} />
                          </div>
                        </Link>
                      ) : (
                        <span>{formatDate(action.date)}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground mb-2">No actions found</p>
              {(selectedType || dateRange.startDate || dateRange.endDate) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedType('all');
                    setDateRange({ startDate: undefined, endDate: undefined });
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
