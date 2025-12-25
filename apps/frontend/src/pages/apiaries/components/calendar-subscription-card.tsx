import { useState } from 'react';
import { Calendar, Copy, Check, RefreshCw, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
  const [copied, setCopied] = useState(false);
  const { data: subscription, isLoading } = useCalendarSubscription(apiaryId);
  const regenerate = useRegenerateCalendarSubscription();

  const handleCopy = async () => {
    if (!subscription?.subscriptionUrl) return;

    try {
      await navigator.clipboard.writeText(subscription.subscriptionUrl);
      setCopied(true);
      toast.success('Subscription URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
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
        toast.success('Subscription URL regenerated');
      },
      onError: () => {
        toast.error('Failed to regenerate subscription URL');
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Subscription
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
          Calendar Subscription
        </CardTitle>
        <CardDescription>
          Subscribe to this apiary's inspection schedule in your calendar app
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
            title="Copy URL"
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
            Add to Calendar
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
            Regenerate URL
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          This URL provides read-only access to your inspection schedule.
          Regenerating the URL will invalidate the previous one.
        </p>
      </CardContent>
    </Card>
  );
}
