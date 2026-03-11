import { useState } from 'react';
import { Calendar, Copy, Check, RefreshCw, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useCalendarSubscription,
  useRegenerateCalendarSubscription,
} from '@/api/hooks/useCalendar';

interface CalendarSubscriptionCardProps {
  apiaryId: string;
}

export function CalendarSubscriptionCard({
  apiaryId,
}: CalendarSubscriptionCardProps) {
  const { t } = useTranslation('apiary');
  const [copied, setCopied] = useState(false);
  const { data: subscription, isLoading } = useCalendarSubscription(apiaryId);
  const regenerate = useRegenerateCalendarSubscription();

  const handleCopy = async () => {
    if (!subscription?.subscriptionUrl) return;

    try {
      await navigator.clipboard.writeText(subscription.subscriptionUrl);
      setCopied(true);
      toast.success(t('apiary:calendarSubscription.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('apiary:calendarSubscription.copyFailed'));
    }
  };

  const handleAddToCalendar = () => {
    if (!subscription?.subscriptionUrl) return;

    // Convert https:// to webcal:// for calendar apps
    const webcalUrl = subscription.subscriptionUrl.replace(
      /^https?:\/\//,
      'webcal://',
    );
    window.open(webcalUrl, '_blank');
  };

  const handleRegenerate = () => {
    regenerate.mutate(apiaryId, {
      onSuccess: () => {
        toast.success(t('apiary:calendarSubscription.regenerated'));
      },
      onError: () => {
        toast.error(t('apiary:calendarSubscription.regenerateFailed'));
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('apiary:calendarSubscription.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('apiary:calendarSubscription.title')}
        </CardTitle>
        <CardDescription>
          {t('apiary:calendarSubscription.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={subscription?.subscriptionUrl || ''}
            readOnly
            className="font-mono text-xs"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            title={t('apiary:calendarSubscription.copyUrl')}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleAddToCalendar}>
            <Plus className="h-4 w-4 mr-2" />
            {t('apiary:calendarSubscription.addToCalendar')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerate.isPending}
          >
            {regenerate.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {t('apiary:calendarSubscription.regenerateUrl')}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {t('apiary:calendarSubscription.readOnlyNote')}
        </p>
      </CardContent>
    </Card>
  );
}
