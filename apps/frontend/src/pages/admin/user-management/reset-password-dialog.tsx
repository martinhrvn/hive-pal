import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { PASSWORD_MIN_LENGTH } from 'shared-schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordField } from './password-field';
import { generatePassword } from './generate-password';

interface ResetPasswordDialogProps {
  readonly email: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onReset: (newPassword: string) => Promise<unknown>;
  readonly isPending?: boolean;
}

/** Sets a temporary password the user must change at their next sign-in. */
export function ResetPasswordDialog({
  email,
  open,
  onOpenChange,
  onReset,
  isPending = false,
}: ResetPasswordDialogProps) {
  const { t } = useTranslation(['admin', 'common']);
  const [password, setPassword] = useState(generatePassword);
  const tooShort = password.length < PASSWORD_MIN_LENGTH;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-test="reset-password-dialog">
        <DialogHeader>
          <DialogTitle>{t('resetPasswordDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('resetPasswordDialog.description', { email })}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            if (!tooShort) void onReset(password);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="temp-password">
              {t('resetPasswordDialog.tempPasswordLabel')}
            </Label>
            <PasswordField
              id="temp-password"
              value={password}
              onValueChange={setPassword}
              placeholder={t('resetPasswordDialog.tempPasswordPlaceholder')}
            />
            <p className="text-sm text-muted-foreground">
              {t('resetPasswordDialog.minCharacters', {
                count: PASSWORD_MIN_LENGTH,
              })}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" disabled={tooShort || isPending}>
              {isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              {t('resetPasswordDialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
