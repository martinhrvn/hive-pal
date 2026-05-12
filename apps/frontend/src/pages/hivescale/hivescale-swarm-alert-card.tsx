import { useEffect, useState } from 'react';
import { Bell, BellOff, Info, Loader2 } from 'lucide-react';
import {
  useUserPreferences,
  useUpdateUserPreferences,
} from '@/api/hooks/useUserPreferences';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface SwarmAlertLocal {
  enabled: boolean;
  weightDropKg: number;
  measurementWindow: number;
}

const DEFAULTS: SwarmAlertLocal = {
  enabled: false,
  weightDropKg: 2,
  measurementWindow: 3,
};

export function HiveScaleSwarmAlertCard() {
  const { data: preferences, isLoading } = useUserPreferences();
  const updatePreferences = useUpdateUserPreferences();

  const [local, setLocal] = useState<SwarmAlertLocal>(DEFAULTS);

  // Sync local state when preferences load
  useEffect(() => {
    if (preferences?.swarmAlert) {
      setLocal({
        enabled: preferences.swarmAlert.enabled ?? DEFAULTS.enabled,
        weightDropKg:
          preferences.swarmAlert.weightDropKg ?? DEFAULTS.weightDropKg,
        measurementWindow:
          preferences.swarmAlert.measurementWindow ??
          DEFAULTS.measurementWindow,
      });
    }
  }, [preferences]);

  async function handleSave() {
    if (local.weightDropKg < 0.1 || local.weightDropKg > 20) {
      toast.error('Weight drop must be between 0.1 kg and 20 kg');
      return;
    }
    if (local.measurementWindow < 2 || local.measurementWindow > 10) {
      toast.error('Measurement window must be between 2 and 10');
      return;
    }

    try {
      await updatePreferences.mutateAsync({
        ...preferences,
        swarmAlert: {
          ...(preferences?.swarmAlert ?? {}),
          enabled: local.enabled,
          weightDropKg: local.weightDropKg,
          measurementWindow: local.measurementWindow,
        },
      });
      toast.success('Swarm alert settings saved');
    } catch {
      toast.error('Failed to save swarm alert settings');
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              {local.enabled ? (
                <Bell className="h-5 w-5 text-amber-500" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              Swarm Alert
            </CardTitle>
            <CardDescription>
              Get an email when a sudden weight drop suggests a swarm has left
              the hive.
            </CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label="How swarm detection works"
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              align="start"
              className="max-w-xs space-y-2 text-left"
            >
              <p className="font-medium">How it works</p>
              <p className="text-xs">
                HivePal checks the last <em>N</em> measurements for each scale
                channel. If the weight fell by more than the configured
                threshold within that window, an alert email is sent.
              </p>
              <p className="text-xs">
                A 6-hour cooldown prevents repeated emails for the same device.
                Alerts are checked every 15 minutes.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading settings…
          </div>
        ) : (
          <>
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="swarm-alert-enabled">
                  Enable swarm alerts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Send an alert email when a swarm is detected
                </p>
              </div>
              <Switch
                id="swarm-alert-enabled"
                checked={local.enabled}
                onCheckedChange={checked =>
                  setLocal(p => ({ ...p, enabled: checked }))
                }
              />
            </div>

            <Separator />

            {/* Weight drop threshold */}
            <div className="space-y-2">
              <Label htmlFor="swarm-weight-drop">
                Weight drop threshold (kg)
              </Label>
              <p className="text-xs text-muted-foreground">
                Alert fires when weight drops by at least this amount within
                the measurement window.
              </p>
              <Input
                id="swarm-weight-drop"
                type="number"
                min="0.1"
                max="20"
                step="0.1"
                value={local.weightDropKg}
                disabled={!local.enabled}
                onChange={e =>
                  setLocal(p => ({
                    ...p,
                    weightDropKg:
                      parseFloat(e.target.value) || DEFAULTS.weightDropKg,
                  }))
                }
                className="max-w-[140px]"
              />
            </div>

            {/* Measurement window */}
            <div className="space-y-2">
              <Label htmlFor="swarm-measurement-window">
                Measurement window (# of readings)
              </Label>
              <p className="text-xs text-muted-foreground">
                Number of consecutive measurements to look back when detecting
                a drop. Min 2, max 10.
              </p>
              <Input
                id="swarm-measurement-window"
                type="number"
                min="2"
                max="10"
                step="1"
                value={local.measurementWindow}
                disabled={!local.enabled}
                onChange={e =>
                  setLocal(p => ({
                    ...p,
                    measurementWindow:
                      parseInt(e.target.value, 10) ||
                      DEFAULTS.measurementWindow,
                  }))
                }
                className="max-w-[140px]"
              />
            </div>

            {local.enabled && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Alerts will be sent to your account email address. A 6-hour
                cooldown applies per device to avoid repeated emails.
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                onClick={handleSave}
                disabled={updatePreferences.isPending}
                className="gap-2"
              >
                {updatePreferences.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {updatePreferences.isPending ? 'Saving…' : 'Save settings'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
