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
    <div className="min-h-screen w-full flex flex-col justify-center relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 bg-cover bg-center bg-[url('/hero2.jpg')]"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/80 via-black/70 to-amber-900/80"></div>
      
      {/* Content */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="text-5xl">🐝</div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Hive Pal
          </h1>
          <h2 className="text-lg text-amber-200">{t('login.title')}</h2>
        </div>

        <div className="backdrop-blur-md bg-white/10 py-8 px-4 shadow-2xl rounded-xl sm:px-10 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email" className="text-white/90">{t('login.email')}</Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={t('login.email')}
                  className="bg-white/90 border-white/30 placeholder:text-gray-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white/90">{t('login.password')}</Label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-amber-300 hover:text-amber-200"
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
                  className="bg-white/90 border-white/30 placeholder:text-gray-500"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-300 text-sm bg-red-900/30 rounded p-2">
                {error}
              </div>
            )}

            <div>
              <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg">
                {t('login.submit')}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/80">
              {t('login.noAccount')}{' '}
              <Link to="/register" className="text-amber-300 hover:text-amber-200 underline">
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
