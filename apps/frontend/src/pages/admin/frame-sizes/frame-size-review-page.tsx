import React, { useState } from 'react';
import { useIsAdmin } from '@/hooks/use-is-admin';
import {
  useAdminFrameSizes,
  useApproveFrameSize,
  useRejectFrameSize,
  useDeleteFrameSize,
  useUpdateFrameSize,
} from '@/api/hooks/useFrameSizes';
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
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '@/hooks/use-date-format';
import { Check, X, Trash2, RefreshCw, Pencil } from 'lucide-react';
import { FrameSize, FrameSizeStatus, UpdateFrameSizeDto } from 'shared-schemas';
import { FrameSizeEditDialog } from '@/components/frame-size-edit-dialog';

const getStatusBadgeVariant = (
  status: string,
): 'destructive' | 'secondary' | 'default' | 'outline' => {
  switch (status) {
    case 'PENDING':
      return 'secondary';
    case 'APPROVED':
      return 'default';
    case 'REJECTED':
      return 'destructive';
    default:
      return 'outline';
  }
};

const FrameSizeReviewPage: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const { formatDate } = useDateFormat();
  const isAdmin = useIsAdmin();
  const { data: frameSizes = [], isLoading, refetch } = useAdminFrameSizes();
  const approveMutation = useApproveFrameSize();
  const rejectMutation = useRejectFrameSize();
  const deleteMutation = useDeleteFrameSize();
  const updateMutation = useUpdateFrameSize();
  const [editing, setEditing] = useState<FrameSize | null>(null);

  const handleSave = async (id: string, data: UpdateFrameSizeDto) => {
    await updateMutation.mutateAsync({ id, data });
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

  const pendingSizes = frameSizes.filter(
    (fs: FrameSize) => fs.status === FrameSizeStatus.PENDING,
  );
  const otherSizes = frameSizes.filter(
    (fs: FrameSize) => fs.status !== FrameSizeStatus.PENDING,
  );

  // Kept out of the JSX below so the loading/empty/list cases stay flat
  // (nested ternaries are flagged by Sonar).
  const renderPendingRows = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-8">
            {t('common:status.loading')}
          </TableCell>
        </TableRow>
      );
    }

    if (pendingSizes.length === 0) {
      return (
        <TableRow>
          <TableCell
            colSpan={6}
            className="text-center py-8 text-muted-foreground"
          >
            {t('frameSizes.noPending')}
          </TableCell>
        </TableRow>
      );
    }

    return pendingSizes.map((fs: FrameSize) => (
      <TableRow key={fs.id}>
        <TableCell className="font-medium">{fs.name}</TableCell>
        <TableCell>{fs.width}</TableCell>
        <TableCell>{fs.height}</TableCell>
        <TableCell>{fs.depth}</TableCell>
        <TableCell>{formatDate(fs.createdAt)}</TableCell>
        <TableCell>
          <div className="flex gap-2">
            {!fs.isBuiltIn && (
              <Button
                variant="outline"
                size="sm"
                data-test="edit-frame-size"
                onClick={() => setEditing(fs)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                {t('common:actions.edit')}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => approveMutation.mutate(fs.id)}
              disabled={approveMutation.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              {t('frameSizes.approve')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => rejectMutation.mutate(fs.id)}
              disabled={rejectMutation.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              {t('frameSizes.reject')}
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Pending Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t('frameSizes.pendingTitle')}
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
          <CardDescription>
            {t('frameSizes.pendingDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead>{t('table.widthMm')}</TableHead>
                  <TableHead>{t('table.heightMm')}</TableHead>
                  <TableHead>{t('table.depthMm')}</TableHead>
                  <TableHead>{t('table.submitted')}</TableHead>
                  <TableHead>{t('common:actions.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderPendingRows()}</TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* All Frame Sizes */}
      <Card>
        <CardHeader>
          <CardTitle>{t('frameSizes.allTitle')}</CardTitle>
          <CardDescription>{t('frameSizes.allDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead>{t('table.dimensionsMm')}</TableHead>
                  <TableHead>{t('table.source')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('common:actions.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherSizes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {t('frameSizes.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  otherSizes.map((fs: FrameSize) => (
                    <TableRow key={fs.id}>
                      <TableCell className="font-medium">{fs.name}</TableCell>
                      <TableCell>
                        {t('frameSizes.dimensions', {
                          width: fs.width,
                          height: fs.height,
                          depth: fs.depth,
                        })}
                      </TableCell>
                      <TableCell>
                        {fs.isBuiltIn ? (
                          <Badge variant="outline">
                            {t('frameSizes.builtIn')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {t('frameSizes.community')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(fs.status)}>
                          {fs.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!fs.isBuiltIn && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={t('common:actions.edit')}
                              data-test="edit-frame-size"
                              onClick={() => setEditing(fs)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              aria-label={t('common:actions.delete')}
                              onClick={() => deleteMutation.mutate(fs.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editing ? (
        <FrameSizeEditDialog
          key={editing.id}
          frameSize={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
};

export default FrameSizeReviewPage;
