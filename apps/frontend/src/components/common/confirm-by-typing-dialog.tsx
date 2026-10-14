import React, { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
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

interface ConfirmByTypingDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
  readonly isPending?: boolean;
  readonly title: string;
  readonly description: string;
  /** Text the user must type (case-insensitive) to enable the confirm button. */
  readonly expectedText: string;
  readonly inputLabel: string;
  readonly confirmLabel: string;
  readonly pendingLabel: string;
  /** Extra content shown between the description and the input. */
  readonly children?: React.ReactNode;
}

const normalize = (value: string) => value.trim().toLowerCase();

type ConfirmFormProps = Pick<
  ConfirmByTypingDialogProps,
  | 'onOpenChange'
  | 'onConfirm'
  | 'expectedText'
  | 'inputLabel'
  | 'confirmLabel'
  | 'pendingLabel'
> & { readonly isPending: boolean };

// Lives inside DialogContent, which unmounts on close, so the typed text
// resets however the dialog gets closed.
const ConfirmForm: React.FC<ConfirmFormProps> = ({
  onOpenChange,
  onConfirm,
  isPending,
  expectedText,
  inputLabel,
  confirmLabel,
  pendingLabel,
}) => {
  const { t } = useTranslation('common');
  const inputId = useId();
  const [typed, setTyped] = useState('');
  const confirmed = normalize(typed) === normalize(expectedText);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={inputId}>{inputLabel}</Label>
        <Input
          id={inputId}
          autoComplete="off"
          value={typed}
          onChange={e => setTyped(e.target.value)}
          disabled={isPending}
          placeholder={expectedText}
        />
      </div>

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
          disabled={isPending || !confirmed}
        >
          {isPending ? pendingLabel : confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
};

/** Destructive confirmation that only enables once the user types `expectedText`. */
export const ConfirmByTypingDialog: React.FC<ConfirmByTypingDialogProps> = ({
  open,
  onOpenChange,
  isPending = false,
  title,
  description,
  children,
  ...formProps
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {title}
        </DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      {children}

      <ConfirmForm
        {...formProps}
        onOpenChange={onOpenChange}
        isPending={isPending}
      />
    </DialogContent>
  </Dialog>
);
