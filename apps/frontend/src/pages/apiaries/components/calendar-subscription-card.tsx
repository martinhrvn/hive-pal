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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCalendarSubscription,
  useRegenerateCalendarSubscription,
  useToggleCalendarInspections,
} from '@/api/hooks/useCalendar';
import { useHives } from '@/api/hooks';
import type { HiveSettings } from 'shared-schemas';

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
  const { data: hives } = useHives();
  const toggleInspections = useToggleCalendarInspections();

  // Derive checkbox state: checked if any active hive has calendarEnabled !== false
  const activeHives = hives?.filter(h => h.status === 'ACTIVE') ?? [];
  const inspectionsEnabled =
    activeHives.length > 0 &&
    activeHives.some(
      h => (h.settings as HiveSettings)?.inspection?.calendarEnabled !== false,
    );

  const handleToggleInspections = (checked: boolean) => {
    toggleInspections.mutate(
      { apiaryId, enabled: !!checked },
      {
        onError: () => {
          toast.error(
            t(
              'apiary:calendarSubscription.updateFailed',
              'Failed to update calendar settings',
            ),
          );
        },
      },
    );
  };

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

        <div className="flex items-center space-x-2">
          <Checkbox
            id={`inspections-enabled-${apiaryId}`}
            checked={inspectionsEnabled}
            onCheckedChange={checked => handleToggleInspections(checked === true)}
            disabled={toggleInspections.isPending}
          />
          <Label
            htmlFor={`inspections-enabled-${apiaryId}`}
            className="text-sm font-normal"
          >
            {t(
              'apiary:calendarSubscription.includeScheduledInspections',
              'Include auto-generated inspections',
            )}
          </Label>
        </div>

        <p className="text-xs text-muted-foreground">
          {t('apiary:calendarSubscription.readOnlyNote')}
        </p>
      </CardContent>
    </Card>
  );
}
