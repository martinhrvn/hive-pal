import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth-context';
import { useIsAdmin } from '@/hooks/use-is-admin.ts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Alert } from '@/components/ui/alert.tsx';
import { AxiosError } from 'axios';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  passwordChangeRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

const UserManagementPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const { token } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Check if user is admin, otherwise redirect
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get<User[]>('/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUsers(response.data);
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || t('messages.failedToFetch'));
        } else {
          setError(t('messages.unexpectedError'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  const handleResetPassword = async () => {
    if (!selectedUser || !tempPassword.trim()) return;

    try {
      setError(null);

      await axios.post(
        `/api/users/${selectedUser.id}/reset-password`,
        { tempPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setResetSuccess(true);

      // Update user in the list to show passwordChangeRequired
      setUsers(
        users.map(u =>
          u.id === selectedUser.id ? { ...u, passwordChangeRequired: true } : u,
        ),
      );

      // Clear temporary password
      setTempPassword('');
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || t('messages.failedToReset'));
      } else {
        setError(t('messages.unexpectedError'));
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center py-8">{t('messages.loadingUsers')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.email')}</TableHead>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead>{t('table.role')}</TableHead>
                  <TableHead>{t('table.passwordChangeRequired')}</TableHead>
                  <TableHead>{t('table.createdAt')}</TableHead>
                  <TableHead>{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.name || t('status.dash')}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      {user.passwordChangeRequired ? t('status.yes') : t('status.no')}
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setTempPassword('');
                              setResetSuccess(false);
                            }}
                          >
                            {t('actions.resetPassword')}
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>{t('resetPasswordDialog.title')}</SheetTitle>
                            <SheetDescription>
                              {t('resetPasswordDialog.description', { email: selectedUser?.email })}
                            </SheetDescription>
                          </SheetHeader>

                          <div className="mt-8 space-y-4">
                            {resetSuccess ? (
                              <div className="bg-green-50 text-green-800 p-4 rounded-md">
                                {t('messages.resetSuccess')}
                              </div>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="temp-password">
                                    {t('resetPasswordDialog.tempPasswordLabel')}
                                  </Label>
                                  <Input
                                    id="temp-password"
                                    type="text"
                                    value={tempPassword}
                                    onChange={e =>
                                      setTempPassword(e.target.value)
                                    }
                                    placeholder={t('resetPasswordDialog.tempPasswordPlaceholder')}
                                  />
                                  <p className="text-sm text-gray-500">
                                    {t('resetPasswordDialog.minCharacters')}
                                  </p>
                                </div>

                                <Button
                                  onClick={handleResetPassword}
                                  disabled={
                                    !tempPassword.trim() ||
                                    tempPassword.length < 6
                                  }
                                  className="w-full"
                                >
                                  {t('resetPasswordDialog.submit')}
                                </Button>
                              </>
                            )}
                          </div>
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementPage;
