import { useState, type ComponentType, type SVGProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { Link2, Loader2, LogIn, Unlink } from 'lucide-react';
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
import {
  useLinkedAccounts,
  useUnlinkAccount,
  type LinkedAccount,
} from '@/api/hooks/useAuth';
import { SOCIAL_PROVIDERS } from './social-providers';
import { useSsoErrorMessage } from './use-sso-error-message';

interface LinkableProvider {
  id: string;
  name: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

interface LinkedAccountRowProps {
  provider: LinkableProvider;
  account: LinkedAccount | undefined;
  canUnlink: boolean;
  onError: (message: string | null) => void;
}

const LinkedAccountRow = ({
  provider,
  account,
  canUnlink,
  onError,
}: LinkedAccountRowProps) => {
  const { t } = useTranslation('common');
  const unlink = useUnlinkAccount();
  const [linking, setLinking] = useState(false);
  const { name, Icon } = provider;

  const handleLink = async () => {
    onError(null);
    setLinking(true);
    const settingsUrl = new URL('/settings', window.location.origin).href;
    try {
      // On success the browser is redirected to the identity provider.
      const result = await authClient.linkSocial({
        provider: provider.id,
        callbackURL: settingsUrl,
        errorCallbackURL: settingsUrl,
      });
      if (result.error) {
        onError(
          result.error.message ??
            t('settings.linkedAccounts.linkFailed', { provider: name }),
        );
        setLinking(false);
      }
    } catch (err) {
      console.error(err);
      onError(t('settings.linkedAccounts.linkFailed', { provider: name }));
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!account) return;
    onError(null);
    try {
      await unlink.mutateAsync(account.id);
    } catch (err) {
      console.error(err);
      onError(t('settings.linkedAccounts.unlinkFailed', { provider: name }));
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">
            {account
              ? t('settings.linkedAccounts.linked')
              : t('settings.linkedAccounts.notLinked')}
          </p>
        </div>
      </div>
      {!account && (
        <Button onClick={handleLink} disabled={linking} className="gap-2">
          {linking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          {t('settings.linkedAccounts.link')}
        </Button>
      )}
      {account && canUnlink && (
        <Button
          variant="outline"
          onClick={handleUnlink}
          disabled={unlink.isPending}
          className="gap-2"
        >
          <Unlink className="h-4 w-4" />
          {t('settings.linkedAccounts.unlink')}
        </Button>
      )}
    </div>
  );
};

/** Lets a signed-in user link or unlink their SSO, Google and Facebook accounts. */
export const LinkedAccountsCard = () => {
  const { t } = useTranslation('common');
  const { oidcEnabled, oidcProviderId, localLoginEnabled, socialProviders } =
    getAuthConfig();
  const { data: accounts = [], isLoading } = useLinkedAccounts();
  const [searchParams] = useSearchParams();
  const linkError = useSsoErrorMessage(searchParams.get('error'));
  const [error, setError] = useState<string | null>(null);

  const providers: LinkableProvider[] = [
    ...(oidcEnabled
      ? [{ id: oidcProviderId, name: t('settings.sso'), Icon: LogIn }]
      : []),
    ...socialProviders.map(id => ({ id, ...SOCIAL_PROVIDERS[id] })),
  ];

  // Accounts the user could still sign in with. A password only counts while
  // local login is enabled.
  const isUsable = (account: LinkedAccount) =>
    account.providerId === 'credential'
      ? localLoginEnabled
      : providers.some(provider => provider.id === account.providerId);
  // Unlinking the last usable sign-in method would lock the user out.
  const canUnlink = (account: LinkedAccount) =>
    accounts.some(other => other.id !== account.id && isUsable(other));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          {t('settings.linkedAccounts.title')}
        </CardTitle>
        <CardDescription>
          {t('settings.linkedAccounts.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(error || linkError) && (
          <Alert variant="destructive">{error || linkError}</Alert>
        )}
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          providers.map(provider => {
            const account = accounts.find(a => a.providerId === provider.id);
            return (
              <LinkedAccountRow
                key={provider.id}
                provider={provider}
                account={account}
                canUnlink={!!account && canUnlink(account)}
                onError={setError}
              />
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
