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
import { FrameSizeStatusBadge } from '@/components/common/frame-size-status-badge';

const PENDING_COLUMNS = 6;
const ALL_COLUMNS = 5;

interface PendingFrameSizeRowsProps {
  sizes: FrameSize[];
  isLoading: boolean;
  formatDate: (date: Date | string) => string;
  onEdit: (frameSize: FrameSize) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  approvingId?: string;
  rejectingId?: string;
}

const PendingFrameSizeRows = ({
  sizes,
  isLoading,
  formatDate,
  onEdit,
  onApprove,
  onReject,
  approvingId,
  rejectingId,
}: PendingFrameSizeRowsProps) => {
  const { t } = useTranslation(['admin', 'common']);

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={PENDING_COLUMNS} className="py-8 text-center">
          {t('common:status.loading')}
        </TableCell>
      </TableRow>
    );
  }

  if (sizes.length === 0) {
    return (
      <TableRow>
        <TableCell
          colSpan={PENDING_COLUMNS}
          className="py-8 text-center text-muted-foreground"
        >
          {t('frameSizes.noPending')}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {sizes.map(size => {
        const isBusy = approvingId === size.id || rejectingId === size.id;
        return (
          <TableRow key={size.id}>
            <TableCell className="font-medium">{size.name}</TableCell>
            <TableCell>{size.width}</TableCell>
            <TableCell>{size.height}</TableCell>
            <TableCell>{size.depth}</TableCell>
            <TableCell>{formatDate(size.createdAt)}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                {!size.isBuiltIn && (
                  <Button
                    variant="outline"
                    size="sm"
                    data-test="edit-frame-size"
                    onClick={() => onEdit(size)}
                  >
                    <Pencil className="mr-1 size-4" />
                    {t('common:actions.edit')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApprove(size.id)}
                  disabled={isBusy}
                >
                  <Check className="mr-1 size-4" />
                  {t('frameSizes.approve')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReject(size.id)}
                  disabled={isBusy}
                >
                  <X className="mr-1 size-4" />
                  {t('frameSizes.reject')}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
};

interface AllFrameSizeRowsProps {
  sizes: FrameSize[];
  isLoading: boolean;
  onEdit: (frameSize: FrameSize) => void;
  onDelete: (id: string) => void;
  deletingId?: string;
}

const AllFrameSizeRows = ({
  sizes,
  isLoading,
  onEdit,
  onDelete,
  deletingId,
}: AllFrameSizeRowsProps) => {
  const { t } = useTranslation(['admin', 'common']);

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={ALL_COLUMNS} className="py-8 text-center">
          {t('common:status.loading')}
        </TableCell>
      </TableRow>
    );
  }

  if (sizes.length === 0) {
    return (
      <TableRow>
        <TableCell
          colSpan={ALL_COLUMNS}
          className="py-8 text-center text-muted-foreground"
        >
          {t('frameSizes.empty')}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {sizes.map(size => (
        <TableRow key={size.id}>
          <TableCell className="font-medium">{size.name}</TableCell>
          <TableCell>
            {t('frameSizes.dimensions', {
              width: size.width,
              height: size.height,
              depth: size.depth,
            })}
          </TableCell>
          <TableCell>
            {size.isBuiltIn ? (
              <Badge variant="outline">{t('frameSizes.builtIn')}</Badge>
            ) : (
              <Badge variant="secondary">{t('frameSizes.community')}</Badge>
            )}
          </TableCell>
          <TableCell>
            <FrameSizeStatusBadge status={size.status} />
          </TableCell>
          <TableCell>
            {!size.isBuiltIn && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t('common:actions.edit')}
                  data-test="edit-frame-size"
                  onClick={() => onEdit(size)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  aria-label={t('common:actions.delete')}
                  onClick={() => onDelete(size.id)}
                  disabled={deletingId === size.id}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

const FrameSizeReviewPage: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const { formatDate } = useDateFormat();
  const isAdmin = useIsAdmin();
  const {
    data: frameSizes = [],
    isLoading,
    isFetching,
    refetch,
  } = useAdminFrameSizes();
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
  const approvingId = approveMutation.isPending
    ? approveMutation.variables
    : undefined;
  const rejectingId = rejectMutation.isPending
    ? rejectMutation.variables
    : undefined;
  const deletingId = deleteMutation.isPending
    ? deleteMutation.variables
    : undefined;

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
              disabled={isFetching}
            >
              <RefreshCw
                className={`mr-2 size-4 ${isFetching ? 'animate-spin' : ''}`}
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
              <TableBody>
                <PendingFrameSizeRows
                  sizes={pendingSizes}
                  isLoading={isLoading}
                  formatDate={formatDate}
                  onEdit={frameSize => setEditing(frameSize)}
                  onApprove={id => approveMutation.mutate(id)}
                  onReject={id => rejectMutation.mutate(id)}
                  approvingId={approvingId}
                  rejectingId={rejectingId}
                />
              </TableBody>
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
                <AllFrameSizeRows
                  sizes={otherSizes}
                  isLoading={isLoading}
                  onEdit={frameSize => setEditing(frameSize)}
                  onDelete={id => deleteMutation.mutate(id)}
                  deletingId={deletingId}
                />
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
