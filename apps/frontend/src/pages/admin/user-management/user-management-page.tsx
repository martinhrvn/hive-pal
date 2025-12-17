import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth-context';
import { useIsAdmin } from '@/hooks/use-is-admin.ts';
import { useAdminUsers } from '@/api/hooks/useAdminUsers';
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
import { UserWithStatsResponse } from 'shared-schemas';

const UserManagementPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const { token } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const { data: users, isLoading, error: queryError, refetch } = useAdminUsers();
  const [selectedUser, setSelectedUser] = useState<UserWithStatsResponse | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Check if user is admin, otherwise redirect
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const handleResetPassword = async () => {
    if (!selectedUser || !tempPassword.trim()) return;

    try {
      setResetError(null);

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

      // Refetch to get updated data
      refetch();

      // Clear temporary password
      setTempPassword('');
    } catch (err) {
      if (err instanceof AxiosError) {
        setResetError(err.response?.data?.message || t('messages.failedToReset'));
      } else {
        setResetError(t('messages.unexpectedError'));
      }
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return t('status.dash');
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return t('status.dash');
    return new Date(dateString).toLocaleString();
  };

  const error = queryError ? t('messages.failedToFetch') : resetError;

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

          {isLoading ? (
            <div className="flex justify-center py-8">
              {t('messages.loadingUsers')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.email')}</TableHead>
                    <TableHead>{t('table.name')}</TableHead>
                    <TableHead>{t('table.role')}</TableHead>
                    <TableHead className="text-center">{t('table.apiaries')}</TableHead>
                    <TableHead className="text-center">{t('table.hives')}</TableHead>
                    <TableHead className="text-center">{t('table.inspections')}</TableHead>
                    <TableHead>{t('table.lastActivity')}</TableHead>
                    <TableHead>{t('table.createdAt')}</TableHead>
                    <TableHead>{t('table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Link
                          to={`/admin/users/${user.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {user.email}
                        </Link>
                      </TableCell>
                      <TableCell>{user.name || t('status.dash')}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell className="text-center">
                        {user.stats.apiariesCount}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.stats.hivesCount}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.stats.inspectionsCount}
                      </TableCell>
                      <TableCell>
                        {formatDate(user.stats.lastActivityDate)}
                      </TableCell>
                      <TableCell>{formatDateTime(user.createdAt.toString())}</TableCell>
                      <TableCell>
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setTempPassword('');
                                setResetSuccess(false);
                                setResetError(null);
                              }}
                            >
                              {t('actions.resetPassword')}
                            </Button>
                          </SheetTrigger>
                          <SheetContent>
                            <SheetHeader>
                              <SheetTitle>
                                {t('resetPasswordDialog.title')}
                              </SheetTitle>
                              <SheetDescription>
                                {t('resetPasswordDialog.description', {
                                  email: selectedUser?.email,
                                })}
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
                                      placeholder={t(
                                        'resetPasswordDialog.tempPasswordPlaceholder',
                                      )}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementPage;
