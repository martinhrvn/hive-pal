import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { getAuthConfig } from '@/lib/auth-config';
import { cn } from '@/lib/utils';

interface SsoButtonProps {
  /** Path to land on after a successful sign-in. */
  redirectTo?: string;
  /** Page to return to with `?error=…` when SSO fails. */
  errorPath: string;
  mode?: 'signIn' | 'signUp';
  className?: string;
}

/** Absolute URL on the frontend origin (the auth callback runs on the backend). */
const toFrontendUrl = (path: string) =>
  new URL(path, window.location.origin).href;

export const SsoButton = ({
  redirectTo = '/',
  errorPath,
  mode = 'signIn',
  className,
}: SsoButtonProps) => {
  const { t } = useTranslation('auth');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { oidcProviderId, oidcButtonLabel } = getAuthConfig();

  const handleClick = async () => {
    setBusy(true);
    setError('');
    try {
      // On success the browser is redirected to the identity provider.
      const result = await authClient.signIn.oauth2({
        providerId: oidcProviderId,
        callbackURL: toFrontendUrl(redirectTo),
        errorCallbackURL: toFrontendUrl(errorPath),
      });
      if (result.error) {
        setError(result.error.message ?? t('sso.errors.generic'));
        setBusy(false);
      }
    } catch (err) {
      console.error('SSO error:', err);
      setError(t('sso.errors.generic'));
      setBusy(false);
    }
  };

  const label =
    mode === 'signUp' ? t('sso.signUp') : oidcButtonLabel || t('sso.signIn');

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className={cn('w-full gap-2 shadow-lg', className)}
        onClick={handleClick}
        disabled={busy}
        data-umami-event="Login SSO"
      >
        <LogIn className="h-4 w-4" />
        {busy ? t('sso.redirecting') : label}
      </Button>
      {error && (
        <div className="text-red-300 text-sm bg-red-900/30 rounded p-2">
          {error}
        </div>
      )}
    </div>
  );
};

export const SsoDivider = ({ label }: { label: string }) => (
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t border-white/20" />
    </div>
    <div className="relative flex justify-center text-xs uppercase tracking-wider">
      <span className="bg-transparent px-2 text-white/60">{label}</span>
    </div>
  </div>
);
