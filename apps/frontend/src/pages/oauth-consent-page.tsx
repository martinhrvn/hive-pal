import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface PublicClient {
  client_name?: string;
  client_uri?: string;
}

interface ConsentRedirect {
  url?: string;
  redirect_uri?: string;
}

// Scopes the user is asked about, in display order. OpenID scopes that only
// identify the user are summarised as one line.
const SCOPE_KEYS = {
  'hivepal:read': 'oauth.scopes.read',
  'hivepal:write': 'oauth.scopes.write',
  offline_access: 'oauth.scopes.offlineAccess',
} as const;
const IDENTITY_SCOPES = new Set(['openid', 'profile', 'email']);

const fetchPublicClient = async (clientId: string) => {
  const { data, error } = await authClient.$fetch<PublicClient>(
    '/oauth2/public-client',
    { method: 'GET', query: { client_id: clientId } },
  );
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Asks the signed-in user whether an OAuth client (e.g. an MCP client such as
 * Claude) may access their Hive Pal data. The backend redirects here with the
 * signed authorization request in the query string.
 */
const OAuthConsentPage = () => {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('client_id') ?? '';
  const scopes = (searchParams.get('scope') ?? '').split(' ').filter(Boolean);
  const scopeKeys = scopes.flatMap(scope =>
    scope in SCOPE_KEYS ? [SCOPE_KEYS[scope as keyof typeof SCOPE_KEYS]] : [],
  );
  const asksIdentity = scopes.some(scope => IDENTITY_SCOPES.has(scope));

  const { data: client } = useQuery({
    queryKey: ['oauth-public-client', clientId],
    queryFn: () => fetchPublicClient(clientId),
    enabled: !!clientId,
  });
  const clientName = client?.client_name || t('oauth.unknownClient');

  const consent = useMutation({
    mutationFn: async (accept: boolean) => {
      const { data, error } = await authClient.$fetch<ConsentRedirect>(
        '/oauth2/consent',
        {
          method: 'POST',
          body: { accept, oauth_query: window.location.search.slice(1) },
        },
      );
      const target = data?.url ?? data?.redirect_uri;
      if (error || !target) throw new Error(error?.message);
      return target;
    },
    // The client's redirect URI receives the code (or access_denied).
    onSuccess: target => window.location.assign(target),
  });

  return (
    <div className="w-full flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <title>{t('oauth.pageTitle')}</title>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('oauth.title', { client: clientName })}</CardTitle>
          <CardDescription>
            {t('oauth.description', { client: clientName })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {consent.isError && (
            <Alert variant="destructive">{t('oauth.failed')}</Alert>
          )}
          <ul className="space-y-2 text-sm">
            {asksIdentity && <ScopeItem label={t('oauth.scopes.identity')} />}
            {scopeKeys.map(key => (
              <ScopeItem key={key} label={t(key)} />
            ))}
          </ul>
          {client?.client_uri && (
            <p className="text-xs text-muted-foreground break-all">
              {client.client_uri}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 justify-end">
          <Button
            variant="outline"
            disabled={consent.isPending}
            onClick={() => consent.mutate(false)}
          >
            {t('oauth.deny')}
          </Button>
          <Button
            disabled={consent.isPending}
            onClick={() => consent.mutate(true)}
          >
            {t('oauth.allow')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const ScopeItem = ({ label }: { label: string }) => (
  <li className="flex items-start gap-2">
    <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
    <span>{label}</span>
  </li>
);

export default OAuthConsentPage;
