import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import type { HiveHubAlertPreferences, UserPreferences } from 'shared-schemas';
import { hiveHubErrorMessage } from '@/api/hooks/useHiveScale';
import { usePreferences } from '@/api/hooks/useUserPreferences';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const SEVERITIES = ['watch', 'warning', 'critical'] as const;
type MinSeverity = (typeof SEVERITIES)[number];

// Mirrors the backend's resolveAlertPreferences(): users who had the retired
// HivePal swarm check on keep getting alerts until they choose otherwise.
const resolveAlertPreferences = (
  preferences: UserPreferences | null | undefined,
): HiveHubAlertPreferences => {
  const legacy = (preferences as { swarmAlert?: { enabled?: boolean } } | null)
    ?.swarmAlert;
  const minSeverity = preferences?.hiveHubAlerts?.minSeverity;
  return {
    enabled: preferences?.hiveHubAlerts?.enabled ?? legacy?.enabled ?? false,
    minSeverity: SEVERITIES.includes(minSeverity as MinSeverity)
      ? (minSeverity as MinSeverity)
      : 'warning',
  };
};

export function HiveHubAlertSettingsCard() {
  const { t } = useTranslation('hivescale');
  const { preferences, updatePreferences } = usePreferences();
  const current = resolveAlertPreferences(preferences.data);
  const busy = preferences.isLoading || updatePreferences.isPending;

  const save = (next: HiveHubAlertPreferences) => {
    // The endpoint replaces the whole preferences object, so everything else
    // the user has set must be sent back unchanged.
    updatePreferences.mutate(
      { ...(preferences.data ?? {}), hiveHubAlerts: next },
      {
        onSuccess: () => toast.success(t('alertSettings.saved')),
        onError: error =>
          toast.error(
            hiveHubErrorMessage(error, t('alertSettings.saveFailed')),
          ),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('alertSettings.title')}
        </CardTitle>
        <CardDescription>{t('alertSettings.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preferences.isError && (
          <p className="text-sm text-destructive">
            {t('alertSettings.loadFailed')}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Switch
            id="hivehub-alerts-enabled"
            checked={current.enabled}
            onCheckedChange={enabled => save({ ...current, enabled })}
            disabled={busy || preferences.isError}
          />
          <Label htmlFor="hivehub-alerts-enabled">
            {t('alertSettings.enable')}
          </Label>
        </div>

        <div className="space-y-2 sm:max-w-xs">
          <Label htmlFor="hivehub-alerts-severity">
            {t('alertSettings.minSeverity')}
          </Label>
          <Select
            value={current.minSeverity}
            onValueChange={value =>
              save({ ...current, minSeverity: value as MinSeverity })
            }
            disabled={busy || preferences.isError || !current.enabled}
          >
            <SelectTrigger id="hivehub-alerts-severity" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERITIES.map(severity => (
                <SelectItem key={severity} value={severity}>
                  {t(`alertSettings.severity.${severity}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t('alertSettings.minSeverityHelp')}
          </p>
        </div>

        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          <li>{t('alertSettings.help.schedule')}</li>
          <li>{t('alertSettings.help.once')}</li>
          <li>{t('alertSettings.help.scope')}</li>
          <li>{t('alertSettings.help.email')}</li>
        </ul>
      </CardContent>
    </Card>
  );
}
