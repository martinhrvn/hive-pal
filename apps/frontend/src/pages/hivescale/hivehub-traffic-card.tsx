import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Save, Zap } from 'lucide-react';
import { toast } from 'sonner';
import {
  hiveHubErrorMessage,
  useHiveScaleDeviceConfig,
  useUpdateHiveScaleConfig,
  type HiveScaleConfigPatch,
  type HiveScaleDevice,
  type HiveScaleDeviceConfig,
  type HiveScaleMeasurement,
} from '@/api/hooks/useHiveScale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { deviceHiveNames, hiveSlotName } from './hivehub-links';

// The ESP32 has no tz database, so HiveHub stores a POSIX TZ string that
// newlib parses directly (DST rules included). '' means UTC.
const TZ_PRESETS = [
  { id: 'cet', value: 'CET-1CEST,M3.5.0,M10.5.0/3' },
  { id: 'uk', value: 'GMT0BST,M3.5.0/1,M10.5.0' },
  { id: 'eet', value: 'EET-2EEST,M3.5.0/3,M10.5.0/4' },
  { id: 'usEastern', value: 'EST5EDT,M3.2.0,M11.1.0' },
  { id: 'usCentral', value: 'CST6CDT,M3.2.0,M11.1.0' },
  { id: 'usMountain', value: 'MST7MDT,M3.2.0,M11.1.0' },
  { id: 'usPacific', value: 'PST8PDT,M3.2.0,M11.1.0' },
  { id: 'utc', value: '' },
] as const;
const TZ_CUSTOM = 'custom';

const BANKS = [
  { bank: 1, key: 'beecounter_bank1_enabled', gates: '00–07' },
  { bank: 2, key: 'beecounter_bank2_enabled', gates: '10–17' },
  { bank: 3, key: 'beecounter_bank3_enabled', gates: '20–27' },
] as const;

const NIGHT_IDLE_FLAG = 0x80;
const DEFAULT_NIGHT_START = 20 * 60;
const DEFAULT_NIGHT_END = 6 * 60;

const minutesToHhmm = (minutes: number | undefined): string => {
  if (minutes === undefined || !Number.isInteger(minutes)) return '';
  if (minutes < 0 || minutes > 1439) return '';
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
};

const hhmmToMinutes = (text: string): number | null => {
  const match = /^\s*(\d{1,2}):(\d{2})/.exec(text);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
};

// Stored false must survive, so `?? true` rather than `|| true`; a server too
// old to know the keys implies all banks on.
const bankEnabled = (
  config: HiveScaleDeviceConfig | undefined,
  key: (typeof BANKS)[number]['key'],
) => config?.[key] ?? true;

const configuredBankMask = (config: HiveScaleDeviceConfig | undefined) =>
  BANKS.reduce(
    (mask, { bank, key }) =>
      bankEnabled(config, key) ? mask | (1 << (bank - 1)) : mask,
    0,
  );

const banksFromMask = (mask: number) =>
  BANKS.filter(({ bank }) => mask & (1 << (bank - 1))).map(({ bank }) => bank);

interface NightDraft {
  enabled: boolean;
  start: string;
  end: string;
  maxTraffic: string;
  tzChoice: string;
  tzCustom: string;
}

const nightDraftFromConfig = (
  config: HiveScaleDeviceConfig | undefined,
): NightDraft => {
  const tz = config?.timezone ?? '';
  const preset = TZ_PRESETS.find(p => p.value === tz);
  return {
    enabled: !!config?.beecounter_night_mode_enabled,
    start: minutesToHhmm(
      config?.beecounter_night_start_minute ?? DEFAULT_NIGHT_START,
    ),
    end: minutesToHhmm(
      config?.beecounter_night_end_minute ?? DEFAULT_NIGHT_END,
    ),
    maxTraffic: String(config?.beecounter_night_max_traffic ?? 0),
    tzChoice: preset ? preset.id : TZ_CUSTOM,
    tzCustom: tz,
  };
};

type BankDraft = Record<(typeof BANKS)[number]['key'], boolean>;

const bankDraftFromConfig = (
  config: HiveScaleDeviceConfig | undefined,
): BankDraft => ({
  beecounter_bank1_enabled: bankEnabled(config, 'beecounter_bank1_enabled'),
  beecounter_bank2_enabled: bankEnabled(config, 'beecounter_bank2_enabled'),
  beecounter_bank3_enabled: bankEnabled(config, 'beecounter_bank3_enabled'),
});

export function HiveHubTrafficCard({
  device,
  latest,
}: Readonly<{
  device: HiveScaleDevice;
  latest: HiveScaleMeasurement | null | undefined;
}>) {
  const { t } = useTranslation('hivescale');
  const configQuery = useHiveScaleDeviceConfig(device.device_id);
  const updateConfig = useUpdateHiveScaleConfig(device.device_id);
  const config = configQuery.data;

  const canEdit = device.role === 'owner' || device.role === 'admin';
  const disabled = !canEdit || !config || updateConfig.isPending;

  // Drafts stay null until the user touches a field, so a config refetch
  // shows through instead of being masked by stale local state.
  const [nightEdit, setNightEdit] = useState<NightDraft | null>(null);
  const [bankEdit, setBankEdit] = useState<BankDraft | null>(null);
  const night = nightEdit ?? nightDraftFromConfig(config);
  const banks = bankEdit ?? bankDraftFromConfig(config);
  const patchNight = (patch: Partial<NightDraft>) =>
    setNightEdit({ ...night, ...patch });

  const startMin = hhmmToMinutes(night.start);
  const endMin = hhmmToMinutes(night.end);
  const emptyWindow = startMin !== null && startMin === endMin;
  const wrapsMidnight =
    startMin !== null && endMin !== null && startMin > endMin;
  const selectedTz =
    night.tzChoice === TZ_CUSTOM
      ? night.tzCustom.trim()
      : (TZ_PRESETS.find(p => p.id === night.tzChoice)?.value ?? '');

  const save = (patch: HiveScaleConfigPatch, onDone: () => void) => {
    if (Object.keys(patch).length === 0) {
      toast.info(t('traffic.noChanges'));
      return;
    }
    updateConfig.mutate(patch, {
      onSuccess: () => {
        onDone();
        toast.success(t('traffic.saved'));
      },
      onError: error =>
        toast.error(hiveHubErrorMessage(error, t('traffic.errors.saveFailed'))),
    });
  };

  const onSaveNight = (event: FormEvent) => {
    event.preventDefault();
    if (disabled || !config) return;
    const maxTraffic = Number.parseInt(night.maxTraffic, 10);
    if (startMin === null || endMin === null) {
      toast.error(t('traffic.errors.invalidTime'));
      return;
    }
    if (!Number.isFinite(maxTraffic) || maxTraffic < 0) {
      toast.error(t('traffic.errors.invalidMaxTraffic'));
      return;
    }
    // The firmware refuses an empty window, so saving one enabled would leave
    // a counter that never sleeps with nothing saying why.
    if (night.enabled && emptyWindow) {
      toast.error(t('traffic.errors.emptyWindow'));
      return;
    }
    const patch: HiveScaleConfigPatch = {};
    if (night.enabled !== !!config.beecounter_night_mode_enabled)
      patch.beecounter_night_mode_enabled = night.enabled;
    if (startMin !== config.beecounter_night_start_minute)
      patch.beecounter_night_start_minute = startMin;
    if (endMin !== config.beecounter_night_end_minute)
      patch.beecounter_night_end_minute = endMin;
    if (maxTraffic !== config.beecounter_night_max_traffic)
      patch.beecounter_night_max_traffic = maxTraffic;
    if (selectedTz !== (config.timezone ?? '')) patch.timezone = selectedTz;
    save(patch, () => setNightEdit(null));
  };

  const onSaveBanks = (event: FormEvent) => {
    event.preventDefault();
    if (disabled || !config) return;
    if (!BANKS.some(({ key }) => banks[key])) {
      toast.error(t('traffic.errors.noBank'));
      return;
    }
    const patch: HiveScaleConfigPatch = {};
    for (const { key } of BANKS) {
      if (banks[key] !== bankEnabled(config, key)) patch[key] = banks[key];
    }
    save(patch, () => setBankEdit(null));
  };

  const hiveNames = deviceHiveNames(device);
  const counters = (latest?.hives ?? []).filter(h => h.bee_counter);
  const savedMask = configuredBankMask(config);
  const enabledBankCount = BANKS.filter(({ key }) => banks[key]).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-5 w-5" />
          {t('traffic.title')}
        </CardTitle>
        <CardDescription>{t('traffic.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!canEdit && (
          <p className="text-sm text-muted-foreground">
            {t('traffic.readOnly', { role: device.role })}
          </p>
        )}
        {configQuery.isLoading && (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        )}
        {configQuery.isError && (
          <p className="text-sm text-destructive">
            {t('traffic.errors.loadFailed')}
          </p>
        )}

        <section className="space-y-3">
          <h3 className="text-sm font-medium">{t('traffic.status.title')}</h3>
          {counters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('traffic.status.none')}
            </p>
          ) : (
            <ul className="space-y-2">
              {counters.map(hive => {
                const counter = hive.bee_counter!;
                const nightIdle =
                  counter.status_flags != null &&
                  (counter.status_flags & NIGHT_IDLE_FLAG) !== 0;
                const reportedMask = counter.banks;
                const idleMinutes =
                  counter.idle_s != null
                    ? Math.ceil(counter.idle_s / 60)
                    : null;
                return (
                  <li
                    key={hive.index}
                    className="flex flex-col gap-2 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {hiveSlotName(
                          hiveNames,
                          hive.index,
                          t('traffic.hiveFallback', { slot: hive.index }),
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {reportedMask == null
                          ? t('traffic.status.banksUnknown')
                          : t('traffic.status.banksRunning', {
                              banks:
                                banksFromMask(reportedMask).join(', ') || '—',
                            })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {nightIdle ? (
                        <Badge
                          variant="outline"
                          className="border-indigo-400 text-xs text-indigo-600 dark:text-indigo-300"
                        >
                          {idleMinutes != null
                            ? t('traffic.status.nightIdleFor', {
                                count: idleMinutes,
                              })
                            : t('traffic.status.nightIdle')}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-green-500 text-xs text-green-600 dark:text-green-400"
                        >
                          {t('traffic.status.counting')}
                        </Badge>
                      )}
                      {reportedMask != null &&
                        config &&
                        (reportedMask === savedMask ? (
                          <Badge variant="outline" className="text-xs">
                            {t('traffic.status.applied')}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-400 text-xs text-amber-600 dark:text-amber-400"
                          >
                            {t('traffic.status.pending')}
                          </Badge>
                        ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Separator />

        <form className="space-y-4" onSubmit={onSaveNight}>
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Moon className="h-4 w-4" />
              {t('traffic.night.title')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('traffic.night.description')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="traffic-night-enabled"
              checked={night.enabled}
              onCheckedChange={checked => patchNight({ enabled: checked })}
              disabled={disabled}
            />
            <Label htmlFor="traffic-night-enabled">
              {t('traffic.night.enable')}
            </Label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="traffic-night-start">
                {t('traffic.night.start')}
              </Label>
              <Input
                id="traffic-night-start"
                type="time"
                value={night.start}
                onChange={event => patchNight({ start: event.target.value })}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="traffic-night-end">
                {t('traffic.night.end')}
              </Label>
              <Input
                id="traffic-night-end"
                type="time"
                value={night.end}
                onChange={event => patchNight({ end: event.target.value })}
                disabled={disabled}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('traffic.night.windowHelp')}
          </p>
          {emptyWindow && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t('traffic.night.emptyWindow')}
            </p>
          )}
          {wrapsMidnight && (
            <p className="text-xs text-muted-foreground">
              {t('traffic.night.wrapsMidnight', {
                start: night.start,
                end: night.end,
              })}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="traffic-timezone">
                {t('traffic.night.timezone')}
              </Label>
              <Select
                value={night.tzChoice}
                onValueChange={value => patchNight({ tzChoice: value })}
                disabled={disabled}
              >
                <SelectTrigger id="traffic-timezone" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TZ_PRESETS.map(preset => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {t(`traffic.night.tzPresets.${preset.id}`)}
                    </SelectItem>
                  ))}
                  <SelectItem value={TZ_CUSTOM}>
                    {t('traffic.night.tzPresets.custom')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {night.tzChoice === TZ_CUSTOM && (
              <div className="space-y-2">
                <Label htmlFor="traffic-timezone-custom">
                  {t('traffic.night.tzCustom')}
                </Label>
                <Input
                  id="traffic-timezone-custom"
                  value={night.tzCustom}
                  placeholder="CET-1CEST,M3.5.0,M10.5.0/3"
                  maxLength={64}
                  onChange={event =>
                    patchNight({ tzCustom: event.target.value })
                  }
                  disabled={disabled}
                />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('traffic.night.timezoneHelp')}
          </p>

          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="traffic-max-traffic">
              {t('traffic.night.maxTraffic')}
            </Label>
            <Input
              id="traffic-max-traffic"
              type="number"
              min={0}
              step={1}
              value={night.maxTraffic}
              onChange={event => patchNight({ maxTraffic: event.target.value })}
              disabled={disabled}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t('traffic.night.maxTrafficHelp')}
          </p>

          <p className="text-xs text-muted-foreground">
            {t('traffic.appliesToAll')}
          </p>
          {canEdit && (
            <Button type="submit" disabled={disabled}>
              <Save className="mr-2 h-4 w-4" />
              {updateConfig.isPending
                ? t('common.saving')
                : t('traffic.night.save')}
            </Button>
          )}
        </form>

        <Separator />

        <form className="space-y-4" onSubmit={onSaveBanks}>
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4" />
              {t('traffic.banks.title')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('traffic.banks.description')}
            </p>
          </div>

          <div className="space-y-2">
            {BANKS.map(({ bank, key, gates }) => (
              <div key={key} className="flex items-center gap-3">
                <Checkbox
                  id={`traffic-${key}`}
                  checked={banks[key]}
                  onCheckedChange={checked =>
                    setBankEdit({ ...banks, [key]: checked === true })
                  }
                  disabled={disabled}
                />
                <Label htmlFor={`traffic-${key}`}>
                  {t('traffic.banks.bank', { bank, gates })}
                </Label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('traffic.banks.current', {
              count: enabledBankCount,
              ma: 60 + enabledBankCount * 80,
            })}
          </p>
          {enabledBankCount === 0 && (
            <p className="text-xs text-destructive">
              {t('traffic.errors.noBank')}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('traffic.banks.help')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('traffic.banks.firmwareNote')}
          </p>
          {canEdit && (
            <Button type="submit" disabled={disabled || enabledBankCount === 0}>
              <Save className="mr-2 h-4 w-4" />
              {updateConfig.isPending
                ? t('common.saving')
                : t('traffic.banks.save')}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
