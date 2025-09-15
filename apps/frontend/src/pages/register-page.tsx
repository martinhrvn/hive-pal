import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { t } = useTranslation('auth');

  const navigate = useNavigate();
  const { register, isLoggedIn } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }

    try {
      const success = await register(email, password, name || undefined);
      if (success) {
        navigate('/login');
      } else {
        setError(t('register.registrationFailed'));
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(t('register.errorOccurred'));
    }
  };

  if (isLoggedIn) {
    navigate('/');
  }

  return (
    <div className="w-full min-h-screen flex flex-col justify-center relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 bg-cover bg-center bg-[url('/hero.jpg')]"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 via-black/70 to-green-900/80"></div>
      
      {/* Content */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="text-5xl">🐝</div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Hive Pal
          </h1>
          <h2 className="text-lg text-green-200">{t('register.title')}</h2>
        </div>

        {error && (
          <div className="text-red-300 text-sm bg-red-900/30 rounded p-2 mb-4 text-center">
            {error}
          </div>
        )}
        
        <div className="backdrop-blur-md bg-white/10 py-8 px-4 shadow-2xl rounded-xl sm:px-10 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email" className="text-white/90">{t('register.email')}</Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('register.emailPlaceholder')}
                  className="bg-white/90 border-white/30 placeholder:text-gray-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="name" className="text-white/90">{t('register.displayName')}</Label>
              <div className="mt-1">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('register.displayNamePlaceholder')}
                  className="bg-white/90 border-white/30 placeholder:text-gray-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-white/90">{t('register.password')}</Label>
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

            <div>
              <Label htmlFor="confirmPassword" className="text-white/90">{t('register.confirmPassword')}</Label>
              <div className="mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="bg-white/90 border-white/30 placeholder:text-gray-500"
                />
              </div>
            </div>

            <div>
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg"
                data-umami-event="Register"
              >
                {t('register.submit')}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/80">
              {t('register.hasAccount')}{' '}
              <Link to="/login" className="text-green-300 hover:text-green-200 underline">
                {t('register.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
