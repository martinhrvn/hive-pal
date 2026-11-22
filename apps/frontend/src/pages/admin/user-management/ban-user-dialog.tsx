import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
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

interface BanUserDialogProps {
  readonly email: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onBan: (reason: string) => Promise<unknown>;
  readonly isPending?: boolean;
}

/** Blocks sign-in (and ends current sessions) until the user is unbanned. */
export function BanUserDialog({
  email,
  open,
  onOpenChange,
  onBan,
  isPending = false,
}: BanUserDialogProps) {
  const { t } = useTranslation(['admin', 'common']);
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-test="ban-user-dialog">
        <DialogHeader>
          <DialogTitle>{t('users.ban.title', { email })}</DialogTitle>
          <DialogDescription>{t('users.ban.description')}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            void onBan(reason.trim());
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="ban-reason">{t('users.ban.reason')}</Label>
            <Input
              id="ban-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={t('users.ban.reasonPlaceholder')}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              {t('users.actions.ban')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
