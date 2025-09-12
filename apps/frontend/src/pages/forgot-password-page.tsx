import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/api/client';
import { ForgotPassword } from 'shared-schemas';
import { AxiosError } from 'axios';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation('auth');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data: ForgotPassword = { email };
      await apiClient.post('/auth/forgot-password', data);
      setIsSubmitted(true);
    } catch (err: unknown) {
      console.error('Forgot password error:', err);
      if (err instanceof AxiosError) {
        setError(err?.response?.data?.message || t('forgotPassword.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-2xl font-semibold mb-2">
            Beekeeping Manager
          </h1>
          <h2 className="text-center text-lg mb-8">
            {t('forgotPassword.emailSent')}
          </h2>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center space-y-4">
              <div className="text-green-600 text-4xl mb-4">✓</div>
              <p className="text-sm text-gray-600">
                {t('forgotPassword.checkEmail')}
              </p>
              <p className="text-xs text-gray-500">
                {t('forgotPassword.emailInstructions')}
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {t('forgotPassword.backToLogin')}
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
        <h2 className="text-center text-lg mb-8">
          {t('forgotPassword.title')}
        </h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">{t('forgotPassword.emailLabel')}</Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('forgotPassword.emailPlaceholder')}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? t('common.loading')
                  : t('forgotPassword.sendReset')}
              </Button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {t('forgotPassword.backToLogin')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
