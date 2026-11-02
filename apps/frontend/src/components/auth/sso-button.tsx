import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { getAuthConfig } from '@/lib/auth-config';
import { cn } from '@/lib/utils';
import { SOCIAL_PROVIDERS } from './social-providers';

interface SsoRedirectProps {
  /** Path to land on after a successful sign-in. */
  redirectTo?: string;
  /** Page to return to with `?error=…` when SSO fails. */
  errorPath: string;
}

interface SsoButtonProps extends SsoRedirectProps {
  /** Better Auth provider id: the OIDC provider id, 'google' or 'facebook'. */
  provider: string;
  label: string;
  icon: ReactNode;
  className?: string;
}

/** Absolute URL on the frontend origin (the auth callback runs on the backend). */
const toFrontendUrl = (path: string) =>
  new URL(path, window.location.origin).href;

export const SsoButton = ({
  provider,
  label,
  icon,
  redirectTo = '/',
  errorPath,
  className,
}: SsoButtonProps) => {
  const { t } = useTranslation('auth');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setBusy(true);
    setError('');
    try {
      // On success the browser is redirected to the identity provider.
      // Generic OAuth providers are registered as social providers in
      // better-auth 1.7, so the standard social sign-in is used.
      const result = await authClient.signIn.social({
        provider,
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

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className={cn('w-full gap-2 shadow-lg', className)}
        onClick={handleClick}
        disabled={busy}
        data-umami-event="Login SSO"
        data-umami-event-provider={provider}
      >
        {icon}
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

interface SsoButtonsProps extends SsoRedirectProps {
  mode: 'signIn' | 'signUp';
  /** Colours of the OIDC button, matching the page's primary action. */
  oidcClassName?: string;
}

/** One button per configured SSO provider: OIDC, then Google and Facebook. */
export const SsoButtons = ({
  mode,
  oidcClassName,
  ...redirect
}: SsoButtonsProps) => {
  const { t } = useTranslation('auth');
  const {
    oidcEnabled,
    oidcAllowSignup,
    oidcProviderId,
    oidcButtonLabel,
    socialProviders,
  } = getAuthConfig();
  const oidcShown = mode === 'signUp' ? oidcAllowSignup : oidcEnabled;
  const oidcLabel =
    mode === 'signUp' ? t('sso.signUp') : oidcButtonLabel || t('sso.signIn');

  return (
    <div className="space-y-3">
      {oidcShown && (
        <SsoButton
          {...redirect}
          provider={oidcProviderId}
          label={oidcLabel}
          icon={<LogIn className="h-4 w-4" />}
          className={oidcClassName}
        />
      )}
      {socialProviders.map(id => {
        const { name, Icon, buttonClassName } = SOCIAL_PROVIDERS[id];
        return (
          <SsoButton
            {...redirect}
            key={id}
            provider={id}
            label={t('sso.continueWith', { provider: name })}
            icon={<Icon className="h-4 w-4" />}
            className={buttonClassName}
          />
        );
      })}
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
