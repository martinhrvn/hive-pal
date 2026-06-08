import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound, Loader2, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { authClient } from '@/lib/auth-client';

interface Passkey {
  id: string;
  name?: string | null;
  createdAt: Date | string;
  deviceType?: string;
}

export const PasskeysCard: React.FC = () => {
  const { t } = useTranslation('common');
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [newName, setNewName] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authClient.passkey.listUserPasskeys();
      if (result.error) {
        setError(result.error.message ?? t('settings.passkeysLoadFailed'));
      } else {
        setPasskeys((result.data ?? []) as Passkey[]);
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleEnroll = async () => {
    setError(null);
    setEnrolling(true);
    try {
      const result = await authClient.passkey.addPasskey({
        name: newName.trim() || undefined,
      });
      if (result?.error) {
        setError(result.error.message ?? t('settings.passkeyAddFailed'));
      } else {
        setNewName('');
        await refresh();
      }
    } catch (err) {
      console.error(err);
      setError(t('settings.passkeyAddCancelled'));
    } finally {
      setEnrolling(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      const result = await authClient.passkey.deletePasskey({ id });
      if (result.error) {
        setError(result.error.message ?? t('settings.passkeyDeleteFailed'));
      } else {
        await refresh();
      }
    } catch (err) {
      console.error(err);
      setError(t('settings.passkeyDeleteFailed'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          {t('settings.passkeys')}
        </CardTitle>
        <CardDescription>{t('settings.passkeysDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={t('settings.passkeyNamePlaceholder')}
            className="sm:flex-1"
          />
          <Button onClick={handleEnroll} disabled={enrolling} className="gap-2">
            {enrolling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            {enrolling
              ? t('settings.passkeyAdding')
              : t('settings.passkeyAdd')}
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">
            {t('settings.passkeysLoading')}
          </p>
        ) : passkeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('settings.passkeysEmpty')}
          </p>
        ) : (
          <ul className="divide-y">
            {passkeys.map(pk => (
              <li
                key={pk.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <div className="font-medium text-sm">
                    {pk.name || t('settings.passkeyUnnamed')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('settings.passkeyAddedOn', {
                      date: new Date(pk.createdAt).toLocaleDateString(),
                    })}
                    {pk.deviceType ? ` · ${pk.deviceType}` : ''}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                  onClick={() => handleDelete(pk.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  {t('settings.passkeyRemove')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default PasskeysCard;
