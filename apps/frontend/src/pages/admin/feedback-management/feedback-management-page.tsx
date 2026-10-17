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
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '@/hooks/use-date-format';
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
  const { t } = useTranslation(['admin', 'common']);
  const { formatDate, formatDateTime } = useDateFormat();
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
          <p>{t('accessDenied')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t('feedback.title')}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              {t('common:actions.refresh')}
            </Button>
          </CardTitle>
          <CardDescription>{t('feedback.description')}</CardDescription>
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
                <SelectValue placeholder={t('feedback.filterByType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('feedback.allTypes')}</SelectItem>
                <SelectItem value="BUG">
                  {t('common:feedback.typeBug')}
                </SelectItem>
                <SelectItem value="SUGGESTION">
                  {t('feedback.typeSuggestion')}
                </SelectItem>
                <SelectItem value="OTHER">
                  {t('common:feedback.typeOther')}
                </SelectItem>
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
                <SelectValue placeholder={t('feedback.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('feedback.allStatuses')}</SelectItem>
                <SelectItem value="NEW">
                  {t('feedback.statuses.NEW')}
                </SelectItem>
                <SelectItem value="REVIEWED">
                  {t('feedback.statuses.REVIEWED')}
                </SelectItem>
                <SelectItem value="RESOLVED">
                  {t('feedback.statuses.RESOLVED')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.type')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('table.subject')}</TableHead>
                  <TableHead>{t('table.from')}</TableHead>
                  <TableHead>{t('table.date')}</TableHead>
                  <TableHead>{t('common:actions.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {t('feedback.loading')}
                    </TableCell>
                  </TableRow>
                ) : feedbackData?.feedbacks?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {t('feedback.empty')}
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
                        {feedback.user?.name ||
                          feedback.email ||
                          t('feedback.anonymous')}
                      </TableCell>
                      <TableCell>{formatDate(feedback.createdAt)}</TableCell>
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
                                  {t('feedback.fromLine', {
                                    sender:
                                      feedback.user?.name ||
                                      feedback.email ||
                                      t('feedback.anonymous'),
                                    date: formatDateTime(feedback.createdAt),
                                  })}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">
                                    {t('feedback.messageLabel')}
                                  </h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {feedback.message}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">
                                    {t('feedback.statusLabel')}
                                  </span>
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
                                      <SelectItem value="NEW">
                                        {t('feedback.statuses.NEW')}
                                      </SelectItem>
                                      <SelectItem value="REVIEWED">
                                        {t('feedback.statuses.REVIEWED')}
                                      </SelectItem>
                                      <SelectItem value="RESOLVED">
                                        {t('feedback.statuses.RESOLVED')}
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
                {t('feedback.showing', {
                  from: filters.offset + 1,
                  to: Math.min(
                    filters.offset + filters.limit,
                    feedbackData.total,
                  ),
                  total: feedbackData.total,
                })}
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
                  {t('common:actions.previous')}
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
                  {t('common:actions.next')}
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
