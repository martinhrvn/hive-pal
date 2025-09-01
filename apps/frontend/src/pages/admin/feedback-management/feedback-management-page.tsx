import React, { useState, useEffect } from 'react';
import { useIsAdmin } from '@/hooks/use-is-admin';
import {
  useAllFeedback,
  useUpdateFeedbackStatus,
} from '@/api/hooks/useFeedback';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Eye, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Feedback } from 'shared-schemas';

interface FeedbackResponse {
  feedbacks: Feedback[];
  total: number;
  limit: number;
  offset: number;
}

const FeedbackManagementPage: React.FC = () => {
  const isAdmin = useIsAdmin();
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    limit: 50,
    offset: 0,
  });
  const queryClient = useQueryClient();
  const {
    data: feedbackData,
    isLoading,
    refetch,
  } = useAllFeedback(filters) as {
    data: FeedbackResponse | undefined;
    isLoading: boolean;
    refetch: () => void;
  };

  const updateStatusMutation = useUpdateFeedbackStatus();

  useEffect(() => {
    if (isAdmin) {
      refetch();
    }
  }, [isAdmin, filters, refetch]);

  const handleStatusUpdate = async (feedbackId: string, newStatus: string) => {
    await updateStatusMutation.mutateAsync({
      id: feedbackId,
      status: newStatus,
    });
    queryClient.invalidateQueries({ queryKey: ['feedback', 'all'] });
    refetch();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'destructive';
      case 'REVIEWED':
        return 'secondary';
      case 'RESOLVED':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'BUG':
        return 'destructive';
      case 'SUGGESTION':
        return 'default';
      case 'OTHER':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Access denied. Admin privileges required.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Feedback Management
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Manage user feedback and support requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select
              value={filters.type || 'all'}
              onValueChange={value =>
                setFilters(prev => ({
                  ...prev,
                  type: value === 'all' ? '' : value || '',
                  offset: 0,
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="BUG">Bug Report</SelectItem>
                <SelectItem value="SUGGESTION">Suggestion</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status || 'all'}
              onValueChange={value =>
                setFilters(prev => ({
                  ...prev,
                  status: value === 'all' ? '' : value || '',
                  offset: 0,
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading feedback...
                    </TableCell>
                  </TableRow>
                ) : feedbackData?.feedbacks?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No feedback found
                    </TableCell>
                  </TableRow>
                ) : (
                  feedbackData?.feedbacks?.map(feedback => (
                    <TableRow key={feedback.id}>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(feedback.type)}>
                          {feedback.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(feedback.status)}>
                          {feedback.status}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="max-w-xs truncate"
                        title={feedback.subject}
                      >
                        {feedback.subject}
                      </TableCell>
                      <TableCell>
                        {feedback.user?.name || feedback.email || 'Anonymous'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(feedback.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Badge
                                    variant={getTypeBadgeVariant(feedback.type)}
                                  >
                                    {feedback.type}
                                  </Badge>
                                  {feedback.subject}
                                </DialogTitle>
                                <DialogDescription>
                                  From:{' '}
                                  {feedback.user?.name ||
                                    feedback.email ||
                                    'Anonymous'}{' '}
                                  •
                                  {format(
                                    new Date(feedback.createdAt),
                                    'MMM dd, yyyy HH:mm',
                                  )}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">Message:</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {feedback.message}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">Status:</span>
                                  <Select
                                    value={feedback.status}
                                    onValueChange={value =>
                                      handleStatusUpdate(feedback.id, value)
                                    }
                                  >
                                    <SelectTrigger className="w-[150px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="NEW">New</SelectItem>
                                      <SelectItem value="REVIEWED">
                                        Reviewed
                                      </SelectItem>
                                      <SelectItem value="RESOLVED">
                                        Resolved
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {feedbackData && feedbackData.total > filters.limit && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {filters.offset + 1} to{' '}
                {Math.min(filters.offset + filters.limit, feedbackData.total)}{' '}
                of {feedbackData.total} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters(prev => ({
                      ...prev,
                      offset: Math.max(0, prev.offset - prev.limit),
                    }))
                  }
                  disabled={filters.offset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters(prev => ({
                      ...prev,
                      offset: prev.offset + prev.limit,
                    }))
                  }
                  disabled={
                    filters.offset + filters.limit >= feedbackData.total
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackManagementPage;
