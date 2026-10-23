import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
  readonly isPending?: boolean;
  readonly title: string;
  readonly description: string;
  /** Confirm button text; defaults to "Delete". */
  readonly confirmLabel?: string;
  /** Confirm button text while pending; defaults to "Deleting...". */
  readonly pendingLabel?: string;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  title,
  description,
  confirmLabel,
  pendingLabel,
}) => {
  const { t } = useTranslation('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={onConfirm}
            variant="destructive"
            disabled={isPending}
          >
            {isPending
              ? (pendingLabel ??
                t('actions.deleting', { defaultValue: 'Deleting...' }))
              : (confirmLabel ??
                t('actions.delete', { defaultValue: 'Delete' }))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
