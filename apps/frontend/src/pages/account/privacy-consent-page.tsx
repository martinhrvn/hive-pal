import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth-context';
import { authClient } from '@/lib/auth-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';

/**
 * Shown once to users whose account was created through SSO: they skipped the
 * signup form, so privacy-policy consent is collected here instead.
 */
const PrivacyConsentPage: React.FC = () => {
  const { t } = useTranslation('auth');
  const { logout } = useAuth();
  const [privacyPolicyConsent, setPrivacyPolicyConsent] = useState(false);
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyPolicyConsent) {
      setError(t('register.consent.privacyRequired'));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const now = new Date();
      const result = await authClient.updateUser({
        privacyPolicyConsent: true,
        privacyConsentTimestamp: now,
        newsletterConsent,
        newsletterConsentTimestamp: newsletterConsent ? now : undefined,
      } as never);
      if (result.error) {
        setError(result.error.message ?? t('consent.saveFailed'));
        setSaving(false);
        return;
      }
      // Full reload so the session (and its consentRequired flag) is refetched.
      window.location.href = '/';
    } catch (err) {
      console.error('Consent error:', err);
      setError(t('consent.saveFailed'));
      setSaving(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('consent.title')}</CardTitle>
          <CardDescription>{t('consent.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="privacy-consent"
                checked={privacyPolicyConsent}
                onCheckedChange={checked =>
                  setPrivacyPolicyConsent(checked as boolean)
                }
                className="mt-1"
              />
              <Label
                htmlFor="privacy-consent"
                className="text-sm leading-relaxed cursor-pointer"
              >
                {t('register.consent.privacyPolicy')}{' '}
                <Link
                  to="/privacy-policy"
                  target="_blank"
                  className="underline"
                >
                  {t('register.consent.privacyPolicyLink')}
                </Link>
                {' *'}
              </Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox
                id="newsletter-consent"
                checked={newsletterConsent}
                onCheckedChange={checked =>
                  setNewsletterConsent(checked as boolean)
                }
                className="mt-1"
              />
              <Label
                htmlFor="newsletter-consent"
                className="text-sm leading-relaxed cursor-pointer"
              >
                {t('register.consent.newsletter')}
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? '…' : t('consent.submit')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={logout}>
            {t('consent.logout')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PrivacyConsentPage;
