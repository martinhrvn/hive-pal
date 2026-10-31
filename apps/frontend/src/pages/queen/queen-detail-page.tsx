import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useDeleteQueen, useQueenHistory } from '@/api/hooks';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';
import {
  DetailAside,
  DetailGrid,
  DetailMain,
} from '@/components/layout/page-grid-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';
import { getQueenDisplayName } from '@/lib/queen-utils';
import { useBreadcrumbStore } from '@/stores/breadcrumb-store';
import { QueenActionSidebar } from './components/detail/queen-action-sidebar';
import { QueenDetailHeader } from './components/detail/queen-detail-header';
import { QueenLineage } from './components/detail/queen-lineage';
import { QueenMovements } from './components/detail/queen-movements';
import { QueenTraits } from './components/detail/queen-traits';
import { QueenNotFound } from './components/queen-not-found';
import { QueenTransferDialog } from './components/queen-transfer-dialog';

const QueenDetailSkeleton = () => (
  <DetailGrid>
    <DetailMain>
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
          <Skeleton className="h-3 w-40" />
          <div className="flex items-center gap-3">
            <Skeleton className="size-7 rounded-full" />
            <Skeleton className="h-9 w-56" />
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        </div>
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </DetailMain>
    <DetailAside>
      <Skeleton className="h-48 rounded-xl" />
    </DetailAside>
  </DetailGrid>
);

type Dialog = 'transfer' | 'delete' | null;

export const QueenDetailPage = () => {
  const { t } = useTranslation('queen');
  const { queenId = '' } = useParams<{ queenId: string }>();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<Dialog>(null);
  const setQueenContext = useBreadcrumbStore(s => s.setQueenContext);

  const { data: queen, isPending, isError } = useQueenHistory(queenId);
  const { canEdit } = useApiaryPermission(queen?.apiaryId);
  const { mutateAsync: deleteQueen, isPending: isDeleting } = useDeleteQueen();

  const breadcrumbName = queen ? getQueenDisplayName(t, queen) : undefined;
  useEffect(() => {
    if (!queen) return;
    setQueenContext({
      id: queen.id,
      name: breadcrumbName,
      hiveId: queen.hiveId ?? undefined,
    });
    return () => setQueenContext(undefined);
  }, [queen, breadcrumbName, setQueenContext]);

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

  return (
    <DetailGrid>
      <DetailMain>
        <div className="space-y-4 sm:space-y-6">
          <QueenDetailHeader queen={queen} />

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:auto-cols-fr md:grid-flow-col">
            <QueenLineage queen={queen} canEdit={canEdit} />
            <QueenTraits queen={queen} />
          </div>

          <QueenMovements
            movements={queen.movements}
            onTransfer={canEdit ? openTransfer : undefined}
          />
        </div>
      </DetailMain>

      <DetailAside>
        <QueenActionSidebar
          queen={queen}
          handlers={
            canEdit
              ? {
                  onTransfer: openTransfer,
                  onDelete: () => setDialog('delete'),
                }
              : undefined
          }
        />
      </DetailAside>

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
    </DetailGrid>
  );
};
