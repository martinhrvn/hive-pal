import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSession } from '@/lib/auth-client';
import { useUpdateNewsletterConsent } from '@/api/hooks/useAuth';

/**
 * Newsletter consent given at signup, changeable here. It saves on toggle
 * rather than with the page's Save button: withdrawing consent has to take
 * effect straight away.
 */
export function NewsletterConsentCard() {
  const { t } = useTranslation('common');
  const { data: session } = useSession();
  const updateConsent = useUpdateNewsletterConsent();

  // Show the requested value while the update is in flight.
  const subscribed = updateConsent.isPending
    ? updateConsent.variables
    : Boolean(session?.user.newsletterConsent);

  const handleChange = (checked: boolean) =>
    updateConsent.mutate(checked, {
      onSuccess: () =>
        toast.success(
          checked
            ? t('settings.newsletter.subscribed')
            : t('settings.newsletter.unsubscribed'),
        ),
      onError: () => toast.error(t('settings.newsletter.updateFailed')),
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {t('settings.newsletter.title')}
        </CardTitle>
        <CardDescription>
          {t('settings.newsletter.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="newsletter-consent">
            {t('settings.newsletter.label')}
          </Label>
          <Switch
            id="newsletter-consent"
            checked={subscribed}
            disabled={!session || updateConsent.isPending}
            onCheckedChange={handleChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
