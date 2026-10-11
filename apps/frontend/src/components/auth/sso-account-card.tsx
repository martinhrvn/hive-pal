import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Link2, Loader2, Unlink } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { authClient } from '@/lib/auth-client';
import { getAuthConfig } from '@/lib/auth-config';
import { useLinkedAccounts, useUnlinkAccount } from '@/api/hooks/useAuth';
import { useSsoErrorMessage } from './use-sso-error-message';

/** Lets a signed-in user link or unlink their SSO (OIDC) identity. */
export const SsoAccountCard: React.FC = () => {
  const { t } = useTranslation('common');
  const { oidcProviderId, localLoginEnabled } = getAuthConfig();
  const { data: providers, isLoading } = useLinkedAccounts();
  const unlink = useUnlinkAccount();
  const [searchParams] = useSearchParams();
  const linkError = useSsoErrorMessage(searchParams.get('error'));
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLinked = !!providers?.includes(oidcProviderId);
  // Unlinking the only sign-in method (or SSO while local login is disabled)
  // would lock the user out.
  const canUnlink =
    isLinked && localLoginEnabled && (providers?.length ?? 0) > 1;

  const handleLink = async () => {
    setError(null);
    setLinking(true);
    const settingsUrl = new URL('/settings', window.location.origin).href;
    try {
      // On success the browser is redirected to the identity provider.
      const result = await authClient.oauth2.link({
        providerId: oidcProviderId,
        callbackURL: settingsUrl,
        errorCallbackURL: settingsUrl,
      });
      if (result.error) {
        setError(result.error.message ?? t('settings.ssoLinkFailed'));
        setLinking(false);
      }
    } catch (err) {
      console.error(err);
      setError(t('settings.ssoLinkFailed'));
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    setError(null);
    try {
      await unlink.mutateAsync(oidcProviderId);
    } catch (err) {
      console.error(err);
      setError(t('settings.ssoUnlinkFailed'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          {t('settings.sso')}
        </CardTitle>
        <CardDescription>{t('settings.ssoDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(error || linkError) && (
          <Alert variant="destructive">{error || linkError}</Alert>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? '…'
              : isLinked
                ? t('settings.ssoLinked')
                : t('settings.ssoNotLinked')}
          </p>
          {!isLoading && !isLinked && (
            <Button onClick={handleLink} disabled={linking} className="gap-2">
              {linking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {t('settings.ssoLink')}
            </Button>
          )}
          {canUnlink && (
            <Button
              variant="outline"
              onClick={handleUnlink}
              disabled={unlink.isPending}
              className="gap-2"
            >
              <Unlink className="h-4 w-4" />
              {t('settings.ssoUnlink')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SsoAccountCard;
