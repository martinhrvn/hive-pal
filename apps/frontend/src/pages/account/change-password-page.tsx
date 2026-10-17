import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth as useAuthContext } from '@/context/auth-context';
import { useChangePassword, useUserProfile } from '@/api/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Alert } from '../../components/ui/alert';

const ChangePasswordPage: React.FC = () => {
  const { t } = useTranslation('auth');
  const { logout } = useAuthContext();
  const { mutateAsync: changePassword, isPending: isChangingPassword } =
    useChangePassword();
  const { data: user } = useUserProfile();

  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t('changePassword.errors.fillAllFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('changePassword.errors.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('changePassword.errors.passwordTooShort'));
      return;
    }

    setError(null);

    try {
      await changePassword({
        currentPassword,
        newPassword,
      });

      logout();
      navigate('/login');
    } catch (err: unknown) {
      console.error('Error changing password:', err);
      setError(t('changePassword.errors.failed'));
    }
  };

  return (
    <div className="w-full flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('changePassword.title')}</CardTitle>
          <CardDescription>
            {user?.passwordChangeRequired
              ? t('changePassword.requiredDescription')
              : t('changePassword.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">
                {t('changePassword.currentPassword')}
              </Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">
                {t('changePassword.newPassword')}
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500">
                {t('changePassword.minLength')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                {t('changePassword.confirmPassword')}
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isChangingPassword}
            >
              {isChangingPassword
                ? t('changePassword.submitting')
                : t('changePassword.submit')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={logout}>
            {t('changePassword.logout')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;
