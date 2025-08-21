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
    <div className="w-full min-h-screen flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl font-semibold mb-2">
          Beekeeping Manager
        </h1>
        <h2 className="text-center text-lg mb-8">{t('register.title')}</h2>
      </div>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">{t('register.email')}</Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('register.emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="name">{t('register.displayName')}</Label>
              <div className="mt-1">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('register.displayNamePlaceholder')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">{t('register.password')}</Label>
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

            <div>
              <Label htmlFor="confirmPassword">{t('register.confirmPassword')}</Label>
              <div className="mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full">
                {t('register.submit')}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p>
              {t('register.hasAccount')}{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
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
