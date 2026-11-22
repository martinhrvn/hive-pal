import { useEffect, useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { generatePassword } from './generate-password';

type PasswordFieldProps = Readonly<
  Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
    value: string;
    onValueChange: (value: string) => void;
  }
>;

/**
 * A visible temporary-password input with generate and copy buttons. The
 * admin hands the password over, so it is shown in plain text on purpose.
 */
export function PasswordField({
  value,
  onValueChange,
  className,
  ...inputProps
}: PasswordFieldProps) {
  const { t } = useTranslation('admin');
  return (
    <div className="flex gap-2">
      <Input
        {...inputProps}
        type="text"
        autoComplete="off"
        spellCheck={false}
        className={cn('font-mono', className)}
        value={value}
        onChange={e => onValueChange(e.target.value)}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => onValueChange(generatePassword())}
        data-test="generate-password"
      >
        <RefreshCw className="size-4" aria-hidden />
        {t('users.password.generate')}
      </Button>
      <CopyButton value={value} />
    </div>
  );
}

/**
 * Copies `value` to the clipboard and briefly confirms it. The clipboard API
 * only exists in secure contexts, so a self-hosted instance served over plain
 * http gets an error toast instead of a silent failure.
 */
export function CopyButton({ value }: Readonly<{ value: string }>) {
  const { t } = useTranslation('admin');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(t('users.password.copied'));
    } catch {
      toast.error(t('users.password.copyFailed'));
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={!value}
      onClick={copy}
      aria-label={t('users.password.copy')}
    >
      {copied ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
    </Button>
  );
}
