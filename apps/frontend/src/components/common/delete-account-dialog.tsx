import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AlertTriangle, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DeleteAccountDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
  readonly isPending?: boolean;
  readonly email: string;
}

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  email,
}) => {
  const { t } = useTranslation('common');
  const [typed, setTyped] = useState('');

  const handleOpenChange = (next: boolean) => {
    if (!next) setTyped('');
    onOpenChange(next);
  };

  const confirmed = typed.trim().toLowerCase() === email.trim().toLowerCase();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t('settings.deleteAccountConfirmTitle', {
              defaultValue: 'Delete your account?',
            })}
          </DialogTitle>
          <DialogDescription>
            {t('settings.deleteAccountConfirmDescription', {
              defaultValue:
                "This permanently deletes your account and all data you own. Apiaries shared with you by others are unaffected, and content you contributed to others' apiaries is kept but anonymized. This action cannot be undone.",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Export reminder */}
          <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
            <Download className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-amber-900 dark:text-amber-200">
                {t('settings.deleteAccountExportReminder', {
                  defaultValue:
                    'Want to keep a copy? Export your data before deleting.',
                })}
              </p>
              <Link
                to="/settings/data-transfer"
                onClick={() => handleOpenChange(false)}
                className="font-medium text-amber-700 underline underline-offset-2 dark:text-amber-300"
              >
                {t('settings.deleteAccountExportLink', {
                  defaultValue: 'Export my data',
                })}
              </Link>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-account-confirm">
              {t('settings.deleteAccountTypeEmail', {
                email,
                defaultValue: 'Type your email address {{email}} to confirm:',
              })}
            </Label>
            <Input
              id="delete-account-confirm"
              autoComplete="off"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              disabled={isPending}
              placeholder={email}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {t('actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={onConfirm}
            variant="destructive"
            disabled={isPending || !confirmed}
          >
            {isPending
              ? t('settings.deleteAccountDeleting', {
                  defaultValue: 'Deleting account...',
                })
              : t('settings.deleteAccountButton', {
                  defaultValue: 'Delete my account',
                })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
