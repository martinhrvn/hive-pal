import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useDeleteQueen, useQueenHistory } from '@/api/hooks';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';
import { QueenDetailHeader } from './components/detail/queen-detail-header';
import { QueenFacts } from './components/detail/queen-facts';
import { VirginQueenNotice } from './components/detail/virgin-queen-notice';
import { QueenLineage } from './components/detail/queen-lineage';
import { QueenMovements } from './components/detail/queen-movements';
import { QueenTraits } from './components/detail/queen-traits';
import { QueenNotFound } from './components/queen-not-found';
import { QueenTransferDialog } from './components/queen-transfer-dialog';

const QueenDetailSkeleton = () => (
  <div className="container mx-auto max-w-3xl space-y-6 p-4">
    <Skeleton className="h-8 w-24" />
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-10" />
        ))}
      </CardContent>
    </Card>
    <Skeleton className="h-40 rounded-xl" />
  </div>
);

type Dialog = 'transfer' | 'delete' | null;

export const QueenDetailPage = () => {
  const { t } = useTranslation('queen');
  const { queenId = '' } = useParams<{ queenId: string }>();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<Dialog>(null);

  const { data: queen, isPending, isError } = useQueenHistory(queenId);
  const { canEdit } = useApiaryPermission(queen?.apiaryId);
  const { mutateAsync: deleteQueen, isPending: isDeleting } = useDeleteQueen();

  if (isPending) return <QueenDetailSkeleton />;
  if (isError) return <QueenNotFound />;

  const closeDialog = (open: boolean) => !open && setDialog(null);
  const openTransfer = () => setDialog('transfer');

  const handleDelete = async () => {
    try {
      await deleteQueen({ id: queen.id, hiveId: queen.hiveId });
      toast.success(t('delete.success'));
      navigate('/queens');
    } catch {
      toast.error(t('delete.error'));
    }
  };

  const notes = queen.notes?.trim();

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/queens">
          <ChevronLeft className="size-4" />
          {t('detail.back')}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <QueenDetailHeader
            queen={queen}
            actions={
              canEdit
                ? {
                    onTransfer: openTransfer,
                    onDelete: () => setDialog('delete'),
                  }
                : undefined
            }
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <VirginQueenNotice queen={queen} />
          <QueenFacts queen={queen} />
          {notes && (
            <div className="space-y-1 border-t pt-4">
              <h2 className="font-overline text-muted-foreground">
                {t('sections.notes')}
              </h2>
              <p className="whitespace-pre-line text-sm">{notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:auto-cols-fr md:grid-flow-col">
        <QueenLineage queen={queen} canEdit={canEdit} />
        <QueenTraits queen={queen} />
      </div>

      <QueenMovements
        movements={queen.movements}
        onTransfer={canEdit ? openTransfer : undefined}
      />

      <QueenTransferDialog
        queen={queen}
        open={dialog === 'transfer'}
        onOpenChange={closeDialog}
      />
      <DeleteConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={closeDialog}
        onConfirm={handleDelete}
        isPending={isDeleting}
        title={t('delete.title')}
        description={t('delete.description')}
      />
    </div>
  );
};
