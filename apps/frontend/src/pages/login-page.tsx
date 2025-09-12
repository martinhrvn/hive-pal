import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { t } = useTranslation('auth');

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggedIn } = useAuth();

  // Get the redirect path from location state, default to '/'
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const success = await login(username, password, from);
      if (!success) {
        setError(t('login.invalidCredentials'));
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('login.invalidCredentials'));
    }
  };

  if (isLoggedIn) {
    navigate(from);
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl font-semibold  mb-2">
          Beekeeping Manager
        </h1>
        <h2 className="text-center text-lg mb-8">{t('login.title')}</h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">{t('login.email')}</Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={t('login.email')}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('login.password')}</Label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}

            <div>
              <Button type="submit" className="w-full">
                {t('login.submit')}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p>
              {t('login.noAccount')}{' '}
              <Link to="/register" className="text-blue-600 hover:underline">
                {t('login.signUp')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
