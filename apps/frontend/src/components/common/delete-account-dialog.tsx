import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { ConfirmByTypingDialog } from './confirm-by-typing-dialog';

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

  return (
    <ConfirmByTypingDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      isPending={isPending}
      title={t('settings.deleteAccountConfirmTitle', {
        defaultValue: 'Delete your account?',
      })}
      description={t('settings.deleteAccountConfirmDescription', {
        defaultValue:
          "This permanently deletes your account and all data you own. Apiaries shared with you by others are unaffected, and content you contributed to others' apiaries is kept but anonymized. This action cannot be undone.",
      })}
      expectedText={email}
      inputLabel={t('settings.deleteAccountTypeEmail', {
        email,
        defaultValue: 'Type your email address {{email}} to confirm:',
      })}
      confirmLabel={t('settings.deleteAccountButton', {
        defaultValue: 'Delete my account',
      })}
      pendingLabel={t('settings.deleteAccountDeleting', {
        defaultValue: 'Deleting account...',
      })}
    >
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
            onClick={() => onOpenChange(false)}
            className="font-medium text-amber-700 underline underline-offset-2 dark:text-amber-300"
          >
            {t('settings.deleteAccountExportLink', {
              defaultValue: 'Export my data',
            })}
          </Link>
        </div>
      </div>
    </ConfirmByTypingDialog>
  );
};
