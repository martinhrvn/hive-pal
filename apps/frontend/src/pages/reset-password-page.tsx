import { FormEvent, useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/api/client';
import { ResetPassword } from 'shared-schemas';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation('auth');

  useEffect(() => {
    if (!token) {
      setError(t('resetPassword.invalidToken'));
    }
  }, [token, t]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError(t('resetPassword.invalidToken'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('resetPassword.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('resetPassword.passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      const data: ResetPassword = { token, password };
      await apiClient.post('/auth/reset-password', data);
      setIsSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err?.response?.data?.message || t('resetPassword.error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-2xl font-semibold mb-2">
            Beekeeping Manager
          </h1>
          <h2 className="text-center text-lg mb-8">{t('resetPassword.success')}</h2>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center space-y-4">
              <div className="text-green-600 text-4xl mb-4">✓</div>
              <p className="text-sm text-gray-600">
                {t('resetPassword.successMessage')}
              </p>
              <p className="text-xs text-gray-500">
                {t('resetPassword.redirectMessage')}
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {t('resetPassword.goToLogin')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl font-semibold mb-2">
          Beekeeping Manager
        </h1>
        <h2 className="text-center text-lg mb-8">{t('resetPassword.title')}</h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="password">{t('resetPassword.newPasswordLabel')}</Label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('resetPassword.newPasswordPlaceholder')}
                  disabled={!token || isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">{t('resetPassword.confirmPasswordLabel')}</Label>
              <div className="mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                  disabled={!token || isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={!token || isLoading}
              >
                {isLoading ? t('common.loading') : t('resetPassword.resetButton')}
              </Button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {t('resetPassword.backToLogin')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;