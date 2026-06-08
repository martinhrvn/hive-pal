import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { authClient } from '@/lib/auth-client';

interface Passkey {
  id: string;
  name?: string | null;
  createdAt: Date | string;
  deviceType?: string;
}

const PasskeysPage: React.FC = () => {
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
        setError(result.error.message ?? 'Failed to load passkeys');
      } else {
        setPasskeys((result.data ?? []) as Passkey[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
        setError(result.error.message ?? 'Failed to add passkey');
      } else {
        setNewName('');
        await refresh();
      }
    } catch (err) {
      console.error(err);
      setError('Passkey enrollment cancelled or failed');
    } finally {
      setEnrolling(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      const result = await authClient.passkey.deletePasskey({ id });
      if (result.error) {
        setError(result.error.message ?? 'Failed to delete passkey');
      } else {
        await refresh();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to delete passkey');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Passkeys</CardTitle>
          <CardDescription>
            Sign in without a password using your device's biometrics or
            security key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert variant="destructive">{error}</Alert>}

          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Name (e.g. MacBook Touch ID)"
              className="flex-1 px-3 py-2 border rounded text-sm"
            />
            <Button onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? 'Adding…' : 'Add passkey'}
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : passkeys.length === 0 ? (
            <p className="text-sm text-gray-500">No passkeys yet.</p>
          ) : (
            <ul className="divide-y">
              {passkeys.map(pk => (
                <li
                  key={pk.id}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <div className="font-medium text-sm">
                      {pk.name || 'Unnamed passkey'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Added {new Date(pk.createdAt).toLocaleDateString()}
                      {pk.deviceType ? ` · ${pk.deviceType}` : ''}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(pk.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PasskeysPage;
