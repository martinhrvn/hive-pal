import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { usePermanentlyDeleteHive } from '@/api/hooks';
import { MenuItemButton } from '@/components/sidebar';
import { ConfirmByTypingDialog } from '@/components/common/confirm-by-typing-dialog';

type DeleteHivePermanentlyProps = {
  hiveId: string;
  hiveName: string;
  apiaryId?: string | null;
};

/** Sidebar action that deletes a hive and all its data after typing its name. */
export const DeleteHivePermanently: React.FC<DeleteHivePermanentlyProps> = ({
  hiveId,
  hiveName,
  apiaryId,
}) => {
  const { t } = useTranslation('hive');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const deleteHive = usePermanentlyDeleteHive();

  const handleConfirm = () =>
    deleteHive.mutate(
      { id: hiveId, apiaryId: apiaryId ?? undefined },
      {
        onSuccess: () => {
          setOpen(false);
          toast.success(
            t('manage.deletePermanentlySuccess', { name: hiveName }),
          );
          navigate(apiaryId ? `/apiaries/${apiaryId}` : '/hives');
        },
        onError: () => toast.error(t('manage.deletePermanentlyFailed')),
      },
    );

  return (
    <>
      <MenuItemButton
        icon={<Trash2 className="h-4 w-4" />}
        label={t('manage.deletePermanently')}
        onClick={() => setOpen(true)}
        className="text-destructive hover:text-destructive"
      />
      <ConfirmByTypingDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
        isPending={deleteHive.isPending}
        title={t('manage.deletePermanentlyTitle')}
        description={t('manage.deletePermanentlyDescription')}
        expectedText={hiveName}
        inputLabel={t('manage.deletePermanentlyTypeName', { name: hiveName })}
        confirmLabel={t('manage.deletePermanentlyButton')}
        pendingLabel={t('manage.deletePermanentlyDeleting')}
      />
    </>
  );
};
