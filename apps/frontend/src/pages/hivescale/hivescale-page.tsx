import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useSearchParams } from 'react-router-dom';
import {
  BatteryCharging,
  ChevronDown,
  Clock,
  Droplets,
  Link2,
  Plus,
  RefreshCw,
  Trash2,
  Unlink,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { HiveResponse } from 'shared-schemas';
import { apiClient } from '@/api/client';
import { useApiaries } from '@/api/hooks/useApiaries';
import {
  useClaimHiveScaleDevice,
  useHiveScaleDevices,
  useHiveScaleInsights,
  useHiveScaleInspections,
  useHiveScaleMeasurements,
  useHiveScaleMembers,
  useReleaseHiveScaleDevice,
  useRemoveHiveScaleDevice,
  useRevokeHiveScaleMember,
  useShareHiveScaleDevice,
  useUpdateHiveScaleChannels,
  type HiveScaleDevice,
  type HiveScaleInsightAlert,
  type HiveScaleInsightSeverity,
  type HiveScaleMeasurement,
  type HiveScaleMeasurementQuery,
} from '@/api/hooks/useHiveScale';
import {
  createPresetDateRange,
  measurementLimitForRange,
  type HiveScaleDateRange,
  type HiveScaleDateRangePreset,
} from './hivescale-date-range';
import { clearStoredDashboardSettings } from './hivescale-local-state';
import { HiveScaleModularDashboard } from './hivescale-modular-dashboard';
import { WirelessSensorsBattery } from './wireless-sensors-battery';
import {
  allHiveSlots,
  channelsPatchFromDraft,
  clearStoredHiveMappings,
  deviceHiveLinks,
  deviceHiveNames,
  emptyHiveMappings,
  hiveSlotName,
  MAX_HIVE_SLOTS,
  type HiveLinksBySlot,
  type HiveMappingBySlot,
} from './hivehub-links';
import { HiveHubAlertSettingsCard } from './hivehub-alert-settings-card';
import { HiveHubAudioPanel } from './hivehub-audio-panel';
import {
  HiveHubCalibrationCard,
  HiveHubTempCompensationCard,
} from './hivehub-calibration-card';
import { HiveHubDataCard } from './hivehub-data-card';
import { HiveHubFirmwareCard } from './hivehub-firmware-card';
import { HiveHubSensorHealthCard } from './hivehub-health-card';
import { HiveHubHiveCards } from './hivehub-hive-cards';
import { HiveHubHubAccessCard } from './hivehub-hub-access-card';
import { HiveHubHubStatusCard } from './hivehub-hub-status-card';
import { HiveHubInspectionCard } from './hivehub-inspection-card';
import { HiveHubSdImportCard } from './hivehub-sd-import-card';
import { HiveHubTrafficCard } from './hivehub-traffic-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  HiveScaleAlertList,
  HiveScaleSeverityPill,
  severityConfig,
} from './hivescale-insights-card';

const numberOrDash = (value: number | null | undefined, digits = 1) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : '—';

const HIVESCALE_DATE_RANGE_STORAGE_KEY = 'hivescale.diagram.dateRange';

const hiveScaleDateRangePresets = [
  '24h',
  '7d',
  '30d',
  '365d',
  'currentYear',
  'all',
  'custom',
] as const satisfies readonly HiveScaleDateRangePreset[];

const isHiveScaleDateRangePreset = (
  value: unknown,
): value is HiveScaleDateRangePreset =>
  typeof value === 'string' &&
  (hiveScaleDateRangePresets as readonly string[]).includes(value);

const isValidDateString = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());

const readStoredDateRange = (): HiveScaleDateRange | undefined => {
  if (typeof globalThis.window === 'undefined') return undefined;

  try {
    const rawValue = globalThis.localStorage.getItem(
      HIVESCALE_DATE_RANGE_STORAGE_KEY,
    );
    if (!rawValue) return undefined;

    const storedValue = JSON.parse(rawValue) as Partial<HiveScaleDateRange>;
    if (!isHiveScaleDateRangePreset(storedValue.preset)) return undefined;

    if (storedValue.preset === 'custom') {
      const fallbackRange = createPresetDateRange('24h');
      return {
        preset: 'custom',
        startAt: isValidDateString(storedValue.startAt)
          ? storedValue.startAt
          : fallbackRange.startAt,
        endAt: isValidDateString(storedValue.endAt)
          ? storedValue.endAt
          : undefined,
      };
    }

    return createPresetDateRange(storedValue.preset);
  } catch {
    return undefined;
  }
};

const formatDateTime = (value: string | null | undefined, t: TFunction) => {
  if (!value) return t('common.never');
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const latestMeasurement = (
  measurements: HiveScaleMeasurement[] | undefined,
) => {
  if (!measurements?.length) return undefined;
  return [...measurements].sort(
    (a, b) =>
      new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
  )[0];
};

/** Hive indexes the device reports in its latest measurement. */
const reportedHiveSlots = (latest: HiveScaleMeasurement | undefined) =>
  [...new Set((latest?.hives ?? []).map(hive => Number(hive.index)))]
    .filter(index => Number.isInteger(index) && index >= 1)
    .sort((a, b) => a - b);

// HiveHub caps one app request at 10k rows (newest first), so a year at a
// 5-minute cadence was silently cut to its last ~35 days. Beyond a week the
// server thins the range evenly instead.
const HIVEHUB_MAX_ROWS = 10000;
const CHART_MAX_POINTS = 2000;

const measurementQueryForRange = (
  dateRange: HiveScaleDateRange,
): HiveScaleMeasurementQuery => {
  // For non-custom presets recompute startAt live on every render so a stale
  // timestamp stored from a previous session never gets sent to the API.
  let startAt: string | undefined;
  if (dateRange.preset === 'all') {
    startAt = undefined;
  } else if (dateRange.preset === 'custom') {
    startAt = dateRange.startAt;
  } else {
    startAt = createPresetDateRange(dateRange.preset).startAt;
  }
  const limit = measurementLimitForRange(dateRange);
  return {
    limit: Math.min(limit, HIVEHUB_MAX_ROWS),
    start_at: startAt,
    end_at: dateRange.preset === 'custom' ? dateRange.endAt : undefined,
    ...(limit > CHART_MAX_POINTS ? { max_points: CHART_MAX_POINTS } : {}),
  };
};

/** Every hive the user can see, across all apiaries, for slot linking. */
const useLinkableHives = () =>
  useQuery<HiveResponse[]>({
    queryKey: ['hives', 'hivehub-linkable'],
    queryFn: async () =>
      (
        await apiClient.get<HiveResponse[]>('/api/hives', {
          headers: { 'x-apiary-id': 'all' },
        })
      ).data,
    staleTime: 60000,
  });

const HIVESCALE_TABS = [
  'overview',
  'inspections',
  'audio',
  'health',
  'setup',
] as const;
type HiveScaleTab = (typeof HIVESCALE_TABS)[number];

// How long the battery voltage has to keep climbing before we treat it as a
// charging signal, and how much sensor jitter we tolerate before considering
// the trend broken.
const BATTERY_RISING_WINDOW_MS = 30 * 60 * 1000;
const BATTERY_VOLTAGE_NOISE_V = 0.005;

const batteryVoltageOf = (measurement: HiveScaleMeasurement) =>
  measurement.battery_voltage_v ?? measurement.battery_voltage ?? null;

// Returns true when the battery voltage has been rising for at least
// `windowMs`. We walk backwards from the latest reading through the contiguous
// "rising" streak (older readings should not be meaningfully higher than newer
// ones) and report a charge as soon as that streak spans the window with an
// overall net rise.
const isBatteryVoltageRising = (
  measurements: HiveScaleMeasurement[] | undefined,
  windowMs = BATTERY_RISING_WINDOW_MS,
) => {
  if (!measurements?.length) return false;

  const sorted = [...measurements].sort(
    (a, b) =>
      new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
  );

  const latest = sorted[0];
  const latestVoltage = batteryVoltageOf(latest);
  if (latestVoltage == null) return false;
  const latestTime = new Date(latest.measured_at).getTime();

  let newerVoltage = latestVoltage;
  for (let i = 1; i < sorted.length; i += 1) {
    const voltage = batteryVoltageOf(sorted[i]);
    if (voltage == null) break;
    // The trend is broken if an older reading is meaningfully higher than the
    // newer one we already accepted (i.e. voltage was falling at that point).
    if (voltage > newerVoltage + BATTERY_VOLTAGE_NOISE_V) break;

    const elapsed = latestTime - new Date(sorted[i].measured_at).getTime();
    if (
      elapsed >= windowMs &&
      latestVoltage - voltage > BATTERY_VOLTAGE_NOISE_V
    ) {
      return true;
    }
    newerVoltage = voltage;
  }

  return false;
};

function LatestValuePanel({
  title,
  description,
  icon: Icon,
  rows,
  badge,
  insight,
  historyAction,
}: Readonly<{
  title: string;
  description: string;
  icon: LucideIcon;
  rows: { label: string; value: ReactNode }[];
  badge?: ReactNode;
  historyAction?: ReactNode;
  insight?: {
    severity: HiveScaleInsightSeverity | null;
    count: number;
    alerts: HiveScaleInsightAlert[];
    scale1Name: string;
    scale2Name: string;
    isLoading?: boolean;
    isError?: boolean;
  };
}>) {
  const { t } = useTranslation('hivescale');
  const [showAlerts, setShowAlerts] = useState(false);
  const hasAlerts = (insight?.alerts.length ?? 0) > 0;

  const insightSummary = (() => {
    if (!insight) return null;
    if (insight.isLoading) return t('common.loading');
    if (insight.isError) return t('common.unavailable');
    if (!hasAlerts) return t('insights.allClear');
    return `${t(severityConfig[insight.severity ?? 'info'].labelKey)}${
      insight.count > 1 ? ` · ${insight.count}` : ''
    }`;
  })();

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        {/* Name on top */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {badge}
        </div>

        <div className="flex gap-4">
          <div className="h-fit rounded-full bg-muted p-3">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            {rows.map(row => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-3"
              >
                <span className="text-xs text-muted-foreground">
                  {row.label}
                </span>
                <span className="text-xl font-semibold">{row.value}</span>
              </div>
            ))}

            {insight && (
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {t('common.insight')}
                  {historyAction}
                </span>
                {hasAlerts ? (
                  <button
                    type="button"
                    onClick={() => setShowAlerts(open => !open)}
                    className="flex items-center gap-1 text-sm font-medium hover:underline"
                    aria-expanded={showAlerts}
                  >
                    <HiveScaleSeverityPill
                      severity={insight.severity}
                      count={insight.count}
                    />
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showAlerts ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    {insightSummary}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {insight && hasAlerts && showAlerts && (
          <div className="pt-1">
            <HiveScaleAlertList
              alerts={insight.alerts}
              scale1Name={insight.scale1Name}
              scale2Name={insight.scale2Name}
              showHive={false}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClaimDeviceCard() {
  const { t } = useTranslation('hivescale');
  const [claimCode, setClaimCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [scale1Name, setScale1Name] = useState('');
  const [scale2Name, setScale2Name] = useState('');
  const claimDevice = useClaimHiveScaleDevice();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const normalizedClaimCode = claimCode.trim();
    if (!normalizedClaimCode) {
      toast.error(t('claim.errors.missingCode'));
      return;
    }

    claimDevice.mutate(
      {
        claim_code: normalizedClaimCode,
        display_name: displayName.trim() || undefined,
        scale_1_display_name: scale1Name.trim() || undefined,
        scale_2_display_name: scale2Name.trim() || undefined,
      },
      {
        onSuccess: () => {
          setClaimCode('');
          setDisplayName('');
          setScale1Name('');
          setScale2Name('');
          toast.success(t('claim.success'));
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('claim.title')}</CardTitle>
        <CardDescription>{t('claim.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="claim-code">{t('claim.claimCode')}</Label>
            <Input
              id="claim-code"
              value={claimCode}
              onChange={event => setClaimCode(event.target.value)}
              placeholder="ABCD-1234"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="display-name">{t('claim.displayName')}</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={event => setDisplayName(event.target.value)}
              placeholder={t('claim.displayNamePlaceholder')}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="claim-scale-1">{t('claim.hive1Name')}</Label>
              <Input
                id="claim-scale-1"
                value={scale1Name}
                onChange={event => setScale1Name(event.target.value)}
                placeholder={t('claim.optional')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claim-scale-2">{t('claim.hive2Name')}</Label>
              <Input
                id="claim-scale-2"
                value={scale2Name}
                onChange={event => setScale2Name(event.target.value)}
                placeholder={t('claim.optional')}
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={claimDevice.isPending}
          >
            {claimDevice.isPending ? t('claim.claiming') : t('claim.claim')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DeviceStatusCard({
  selectedDevice,
  latest,
}: Readonly<{
  selectedDevice: HiveScaleDevice;
  latest: HiveScaleMeasurement | undefined;
}>) {
  const { t } = useTranslation('hivescale');
  const [showShareForm, setShowShareForm] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer');
  const members = useHiveScaleMembers(
    selectedDevice.device_id,
    !!selectedDevice,
  );
  const shareDevice = useShareHiveScaleDevice(selectedDevice.device_id);
  const revokeMember = useRevokeHiveScaleMember(selectedDevice.device_id);
  const canManageMembers = selectedDevice.role === 'owner';

  const submitShare = (event: FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error(t('status.errors.missingEmail'));
      return;
    }

    shareDevice.mutate(
      { email: normalizedEmail, role },
      {
        onSuccess: () => {
          setEmail('');
          setRole('viewer');
          setShowShareForm(false);
          toast.success(t('status.shareSuccess'));
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('status.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              {t('status.deviceId')}
            </span>
            <span className="text-right font-mono">
              {selectedDevice.device_id}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{t('status.role')}</span>
            <span>{t(`status.roles.${selectedDevice.role}`)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              {t('status.lastMeasurement')}
            </span>
            <span className="text-right">
              {formatDateTime(latest?.measured_at, t)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              {t('status.lastSeen')}
            </span>
            <span className="text-right">
              {formatDateTime(selectedDevice.last_seen_at, t)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              {t('status.claimedAt')}
            </span>
            <span className="text-right">
              {formatDateTime(selectedDevice.claimed_at, t)}
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{t('status.sharing')}</p>
              <p className="text-xs text-muted-foreground">
                {t('status.sharingHint')}
              </p>
            </div>
            {canManageMembers && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowShareForm(value => !value)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('status.shareWithUser')}
              </Button>
            )}
          </div>

          {showShareForm && canManageMembers && (
            <form
              className="space-y-3 rounded-md border p-3"
              onSubmit={submitShare}
            >
              <div className="space-y-2">
                <Label htmlFor="share-email">{t('status.email')}</Label>
                <Input
                  id="share-email"
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('status.role')}</Label>
                <Select
                  value={role}
                  onValueChange={value => setRole(value as 'admin' | 'viewer')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">{t('status.viewer')}</SelectItem>
                    <SelectItem value="admin">{t('status.admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={shareDevice.isPending}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {shareDevice.isPending
                  ? t('status.sharing_progress')
                  : t('status.grantAccess')}
              </Button>
            </form>
          )}

          {members.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="space-y-2">
              {(members.data ?? []).map(member => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {member.name || member.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email} · {t(`status.roles.${member.role}`)}
                    </p>
                  </div>
                  {canManageMembers && member.role !== 'owner' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={revokeMember.isPending}
                      onClick={() =>
                        revokeMember.mutate(member.user_id, {
                          onSuccess: () =>
                            toast.success(t('status.accessRevoked')),
                          onError: error => toast.error(error.message),
                        })
                      }
                    >
                      {t('status.revokeAccess')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const UNLINKED = '__unlinked__';

function ScaleMappingCard({
  selectedDevice,
  reportedHives,
}: Readonly<{
  selectedDevice: HiveScaleDevice | undefined;
  reportedHives: number[];
}>) {
  const { t } = useTranslation('hivescale');
  const updateChannels = useUpdateHiveScaleChannels(selectedDevice?.device_id);
  const linkableHives = useLinkableHives();
  const apiaries = useApiaries();
  const saved = useMemo(
    () => ({
      names: deviceHiveNames(selectedDevice),
      links: deviceHiveLinks(selectedDevice),
    }),
    [selectedDevice],
  );
  const [draftNames, setDraftNames] = useState<HiveMappingBySlot>(saved.names);
  const [draftLinks, setDraftLinks] = useState<HiveLinksBySlot>(saved.links);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingLink, setEditingLink] = useState('');

  useEffect(() => {
    setDraftNames(saved.names);
    setDraftLinks(saved.links);
  }, [saved]);

  const apiaryName = useMemo(() => {
    const byId = new Map((apiaries.data ?? []).map(a => [a.id, a.name]));
    return (id?: string) => (id ? byId.get(id) : undefined);
  }, [apiaries.data]);

  const hivesById = useMemo(
    () => new Map((linkableHives.data ?? []).map(hive => [hive.id, hive])),
    [linkableHives.data],
  );

  if (!selectedDevice || selectedDevice.role === 'viewer') return null;

  const patch = channelsPatchFromDraft(saved, {
    names: draftNames,
    links: draftLinks,
  });
  const isDirty = Boolean(patch.names || patch.hive_ids);

  const openSlotEditor = (slot: number) => {
    setEditingSlot(slot);
    setEditingName(draftNames[slot] ?? '');
    setEditingLink(draftLinks[slot] ?? '');
  };

  const closeSlotEditor = () => setEditingSlot(null);

  const selectLink = (value: string) => {
    const hiveId = value === UNLINKED ? '' : value;
    setEditingLink(hiveId);
    // Linking a hive names the slot after it unless a name was typed already.
    const hive = hivesById.get(hiveId);
    if (hive && !editingName.trim()) setEditingName(hive.name);
  };

  const applySlot = (name: string, link: string) => {
    if (editingSlot === null) return;
    setDraftNames(current => ({ ...current, [editingSlot]: name.trim() }));
    setDraftLinks(current => ({ ...current, [editingSlot]: link }));
    closeSlotEditor();
  };

  const saveMapping = () => {
    updateChannels.mutate(patch, {
      onSuccess: () => {
        // The names now live in HiveHub; drop the old browser-only copy.
        clearStoredHiveMappings(selectedDevice.device_id);
        toast.success(t('mapping.success'));
      },
      onError: error => toast.error(error.message),
    });
  };

  const mappedCount = allHiveSlots().filter(
    slot => draftNames[slot] || draftLinks[slot],
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('mapping.title')}</CardTitle>
        <CardDescription>{t('mapping.slotsDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {allHiveSlots().map(slot => {
            const name = draftNames[slot]?.trim();
            const linked = draftLinks[slot]
              ? hivesById.get(draftLinks[slot])
              : undefined;
            const reported = reportedHives.includes(slot);
            return (
              <button
                key={slot}
                type="button"
                onClick={() => openSlotEditor(slot)}
                className={`flex h-16 flex-col justify-between rounded-md border p-2 text-left transition hover:border-primary hover:bg-muted/50 ${
                  name || linked
                    ? 'bg-card'
                    : 'border-dashed bg-muted/20 text-muted-foreground'
                }`}
                title={name || t('mapping.mapSlot', { slot })}
              >
                <span className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                  {slot}
                  {reported && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                      title={t('mapping.reporting')}
                    />
                  )}
                </span>
                {name ? (
                  <span className="truncate text-xs font-medium text-foreground">
                    {name}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    {t('mapping.add')}
                  </span>
                )}
                {draftLinks[slot] && (
                  <span className="inline-flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                    <Link2 className="h-3 w-3 shrink-0" />
                    {linked?.name ?? t('mapping.unknownHive')}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {t('mapping.mappedCount', {
              count: mappedCount,
              total: MAX_HIVE_SLOTS,
            })}
          </p>
          <Button
            onClick={saveMapping}
            disabled={!isDirty || updateChannels.isPending}
          >
            {updateChannels.isPending ? t('common.saving') : t('mapping.save')}
          </Button>
        </div>

        <Dialog
          open={editingSlot !== null}
          onOpenChange={open => {
            if (!open) closeSlotEditor();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t('mapping.dialogTitle', { slot: editingSlot ?? '' })}
              </DialogTitle>
              <DialogDescription>
                {t('mapping.dialogDescription')}
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={event => {
                event.preventDefault();
                applySlot(editingName, editingLink);
              }}
            >
              <div className="space-y-2">
                <Label>{t('mapping.linkedHive')}</Label>
                <Select
                  value={editingLink || UNLINKED}
                  onValueChange={selectLink}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNLINKED}>
                      {t('mapping.notLinked')}
                    </SelectItem>
                    {(linkableHives.data ?? [])
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(hive => (
                        <SelectItem key={hive.id} value={hive.id}>
                          {hive.name}
                          {apiaryName(hive.apiaryId)
                            ? ` · ${apiaryName(hive.apiaryId)}`
                            : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('mapping.linkHint')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`mapping-slot-name-${editingSlot ?? 'new'}`}>
                  {t('mapping.displayName')}
                </Label>
                <Input
                  id={`mapping-slot-name-${editingSlot ?? 'new'}`}
                  value={editingName}
                  onChange={event => setEditingName(event.target.value)}
                  placeholder={t('mapping.hiveNamePlaceholder')}
                  maxLength={120}
                />
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => applySlot('', '')}
                >
                  {t('mapping.clearSlot')}
                </Button>
                <Button type="submit">{t('mapping.applySlot')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function GeneralPanel({
  latest,
  measurements,
  hiveNames,
}: Readonly<{
  latest: HiveScaleMeasurement | undefined;
  measurements: HiveScaleMeasurement[] | undefined;
  hiveNames: HiveMappingBySlot;
}>) {
  const { t } = useTranslation('hivescale');
  // The MAX17048 fuel gauge reports state-of-charge above 100% while the cell
  // is actively taking charge, so we treat >100% as the "charging" signal.
  // We also treat a sustained rise in battery voltage (>= 30 minutes) as
  // charging, since the SoC can plateau at/below 100% while the pack is still
  // being topped up.
  const isBatteryCharging =
    (latest?.battery_soc_percent ?? 0) > 100 ||
    isBatteryVoltageRising(measurements);

  return (
    <LatestValuePanel
      title={t('panel.general.title')}
      description={t('panel.general.description')}
      icon={Droplets}
      rows={[
        {
          label: t('panel.ambientTemperature'),
          value: `${numberOrDash(latest?.ambient_temp_c)} °C`,
        },
        {
          label: t('panel.ambientHumidity'),
          value: `${numberOrDash(latest?.ambient_humidity_percent, 0)}%`,
        },
        {
          label: t('panel.batteryCharge'),
          value: (
            <span className="flex items-center gap-1.5">
              {isBatteryCharging && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                  title={t('panel.charging')}
                >
                  <BatteryCharging className="h-3.5 w-3.5" aria-hidden />
                  {t('panel.charging')}
                </span>
              )}
              {`${numberOrDash(latest?.battery_soc_percent, 0)}%`}
            </span>
          ),
        },
        {
          label: t('panel.solarInput'),
          value: `${numberOrDash(latest?.solar_load_voltage_v, 2)} V`,
        },
        {
          label: t('panel.wirelessSensorsBattery'),
          value: (
            <WirelessSensorsBattery
              measurement={latest}
              channel1Name={hiveSlotName(hiveNames, 1)}
              channel2Name={hiveSlotName(hiveNames, 2)}
            />
          ),
        },
      ]}
    />
  );
}

export function HiveScalePage() {
  const { t } = useTranslation('hivescale');
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>();
  const [dateRange, setDateRange] = useState<HiveScaleDateRange>(
    () => readStoredDateRange() ?? createPresetDateRange('24h'),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCalibrationPolling, setIsCalibrationPolling] = useState(false);
  const devices = useHiveScaleDevices();

  const requestedTab = searchParams.get('tab');
  const hasDevices = Boolean(devices.data?.length);
  const tab: HiveScaleTab = HIVESCALE_TABS.includes(
    requestedTab as HiveScaleTab,
  )
    ? (requestedTab as HiveScaleTab)
    : hasDevices || devices.isLoading
      ? 'overview'
      : 'setup';
  const setTab = (value: string) =>
    setSearchParams(
      params => {
        params.set('tab', value);
        return params;
      },
      { replace: true },
    );

  const measurementQuery = useMemo(
    () => measurementQueryForRange(dateRange),
    [dateRange],
  );
  const measurements = useHiveScaleMeasurements(
    selectedDeviceId,
    measurementQuery,
    { refetchInterval: isCalibrationPolling ? 5000 : 60000 },
  );
  const insights = useHiveScaleInsights(selectedDeviceId, { lookbackDays: 14 });
  const inspections = useHiveScaleInspections(
    selectedDeviceId,
    { start_at: measurementQuery.start_at, limit: 500 },
    { enabled: tab === 'overview' },
  );
  const removeDevice = useRemoveHiveScaleDevice();
  const releaseDevice = useReleaseHiveScaleDevice();

  useEffect(() => {
    if (!selectedDeviceId && devices.data?.length) {
      setSelectedDeviceId(devices.data[0].device_id);
    }
  }, [devices.data, selectedDeviceId]);

  useEffect(() => {
    if (typeof globalThis.window === 'undefined') return;

    try {
      globalThis.localStorage.setItem(
        HIVESCALE_DATE_RANGE_STORAGE_KEY,
        JSON.stringify(dateRange),
      );
    } catch {
      // Ignore storage failures, for example private mode or disabled storage.
    }
  }, [dateRange]);

  useEffect(() => {
    if (
      selectedDeviceId &&
      devices.data &&
      !devices.data.some(device => device.device_id === selectedDeviceId)
    ) {
      setSelectedDeviceId(devices.data[0]?.device_id);
    }
  }, [devices.data, selectedDeviceId]);

  const selectedDevice = devices.data?.find(
    device => device.device_id === selectedDeviceId,
  );
  const hiveNames = useMemo(
    () =>
      selectedDevice ? deviceHiveNames(selectedDevice) : emptyHiveMappings(),
    [selectedDevice],
  );

  const latest = latestMeasurement(measurements.data);
  const reportedHives = useMemo(() => reportedHiveSlots(latest), [latest]);
  const inspectionActive = Boolean(latest?.inspection);

  useEffect(() => {
    if (latest?.calibration_mode === false && isCalibrationPolling) {
      setIsCalibrationPolling(false);
    }
  }, [isCalibrationPolling, latest?.calibration_mode]);

  const refreshHiveScaleData = async () => {
    setIsRefreshing(true);

    try {
      if (dateRange.preset !== 'custom') {
        setDateRange(createPresetDateRange(dateRange.preset));
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['hivescale'] }),
        queryClient.invalidateQueries({ queryKey: ['hives'] }),
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('page.refreshError'),
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Locally cached, device_id-scoped state that must not outlive the pairing.
  // The device_id is stable across re-pairings, so leaving these behind made a
  // re-claimed device reappear wearing hive names and a layout the beekeeper
  // had already discarded.
  const forgetLocalDeviceState = (deviceId: string) => {
    clearStoredHiveMappings(deviceId);
    clearStoredDashboardSettings(deviceId);
  };

  const removeSelectedDevice = () => {
    if (!selectedDevice) return;
    const confirmed = globalThis.confirm(
      t('page.removeConfirm', {
        name: selectedDevice.display_name || selectedDevice.device_id,
      }),
    );
    if (!confirmed) return;

    const deviceId = selectedDevice.device_id;
    removeDevice.mutate(deviceId, {
      onSuccess: result => {
        forgetLocalDeviceState(deviceId);
        setSelectedDeviceId(undefined);
        // The backend releases the device only when the last member leaves;
        // say which happened, because it decides whether the claim code works
        // again or the remaining members still hold the pairing.
        toast.success(
          result?.released === false
            ? t('page.removeSuccessShared')
            : t('page.removeSuccess'),
        );
      },
      onError: error => toast.error(error.message),
    });
  };

  const releaseSelectedDevice = () => {
    if (!selectedDevice) return;
    const confirmed = globalThis.confirm(
      t('page.releaseConfirm', {
        name: selectedDevice.display_name || selectedDevice.device_id,
      }),
    );
    if (!confirmed) return;

    const deviceId = selectedDevice.device_id;
    releaseDevice.mutate(deviceId, {
      onSuccess: () => {
        forgetLocalDeviceState(deviceId);
        setSelectedDeviceId(undefined);
        toast.success(t('page.releaseSuccess'));
      },
      onError: error => toast.error(error.message),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('page.title')}
          </h1>
          <p className="text-muted-foreground">{t('page.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {devices.isLoading ? (
            <Skeleton className="h-10 w-full sm:w-64" />
          ) : hasDevices ? (
            <Select
              value={selectedDeviceId}
              onValueChange={setSelectedDeviceId}
            >
              <SelectTrigger
                className="w-full sm:w-64"
                aria-label={t('setup.selectDevice')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(devices.data ?? []).map(device => (
                  <SelectItem key={device.device_id} value={device.device_id}>
                    {device.display_name || device.device_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={refreshHiveScaleData}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            {isRefreshing ? t('page.refreshing') : t('page.refresh')}
          </Button>
        </div>
      </div>

      {devices.isError && (
        <Alert variant="destructive">
          <AlertTitle>{t('page.unavailableTitle')}</AlertTitle>
          <AlertDescription>
            {devices.error instanceof Error
              ? devices.error.message
              : t('common.unknownError')}
          </AlertDescription>
        </Alert>
      )}

      {inspectionActive && tab !== 'inspections' && (
        <Alert>
          <AlertTitle>{t('page.inspectionActiveTitle')}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            {t('page.inspectionActiveBody')}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTab('inspections')}
            >
              {t('page.openInspections')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList>
            <TabsTrigger value="overview" disabled={!selectedDevice}>
              {t('page.tabs.overview')}
            </TabsTrigger>
            <TabsTrigger value="inspections" disabled={!selectedDevice}>
              {t('page.tabs.inspections')}
            </TabsTrigger>
            <TabsTrigger value="audio" disabled={!selectedDevice}>
              {t('page.tabs.audio')}
            </TabsTrigger>
            <TabsTrigger value="health" disabled={!selectedDevice}>
              {t('page.tabs.health')}
            </TabsTrigger>
            <TabsTrigger value="setup">{t('page.tabs.setup')}</TabsTrigger>
          </TabsList>
        </div>

        {selectedDevice && (
          <TabsContent value="overview" className="space-y-6">
            <HiveHubHiveCards
              device={selectedDevice}
              measurements={measurements.data}
              hiveNames={hiveNames}
              alerts={insights.data?.alerts ?? []}
              insightsLoading={insights.isLoading}
              insightsError={insights.isError}
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <GeneralPanel
                latest={latest}
                measurements={measurements.data}
                hiveNames={hiveNames}
              />
            </div>
            <HiveScaleModularDashboard
              selectedDevice={selectedDevice}
              measurements={measurements.data}
              measurementsLoading={measurements.isLoading}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              scale1Name={hiveSlotName(hiveNames, 1, t('common.scale1'))}
              scale2Name={hiveSlotName(hiveNames, 2, t('common.scale2'))}
              hiveMappings={hiveNames}
              alerts={insights.data?.alerts ?? []}
              insightsLoading={insights.isLoading}
              insightsError={insights.isError}
              inspections={inspections.data}
            />
          </TabsContent>
        )}

        {selectedDevice && (
          <TabsContent value="inspections">
            <HiveHubInspectionCard
              device={selectedDevice}
              hiveNames={hiveNames}
              reportedHives={reportedHives}
            />
          </TabsContent>
        )}

        {selectedDevice && (
          <TabsContent value="audio">
            <HiveHubAudioPanel
              device={selectedDevice}
              latest={latest}
              hiveNames={hiveNames}
            />
          </TabsContent>
        )}

        {selectedDevice && (
          <TabsContent value="health" className="space-y-4">
            <HiveHubHubStatusCard
              device={selectedDevice}
              latest={latest}
              measurements={measurements.data}
            />
            <HiveHubSensorHealthCard
              device={selectedDevice}
              latest={latest}
              hiveNames={hiveNames}
            />
          </TabsContent>
        )}

        <TabsContent value="setup" className="space-y-4">
          {selectedDevice && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={removeSelectedDevice}
                disabled={removeDevice.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('setup.removeScale')}
              </Button>
              {/* Owners only: removing yourself leaves a shared device
                  claimed by everyone else, so it cannot be re-paired until
                  each member removes themselves. This releases it outright. */}
              {selectedDevice.role === 'owner' && (
                <Button
                  variant="outline"
                  onClick={releaseSelectedDevice}
                  disabled={releaseDevice.isPending}
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  {t('setup.releaseScale')}
                </Button>
              )}
            </div>
          )}
          {!devices.isLoading && !hasDevices && (
            <p className="text-sm text-muted-foreground">
              {t('setup.noDevicesYet')}
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ClaimDeviceCard />
            {selectedDevice && (
              <DeviceStatusCard
                selectedDevice={selectedDevice}
                latest={latest}
              />
            )}
            <HiveHubAlertSettingsCard />
          </div>
          {selectedDevice && (
            <>
              <ScaleMappingCard
                selectedDevice={selectedDevice}
                reportedHives={reportedHives}
              />
              <div className="grid gap-4 lg:grid-cols-2">
                <HiveHubCalibrationCard
                  device={selectedDevice}
                  latest={latest}
                  hiveNames={hiveNames}
                  onCalibrationPollingChange={setIsCalibrationPolling}
                />
                <HiveHubTempCompensationCard
                  device={selectedDevice}
                  latest={latest}
                  hiveNames={hiveNames}
                />
                <HiveHubTrafficCard device={selectedDevice} latest={latest} />
                <HiveHubHubAccessCard device={selectedDevice} latest={latest} />
                <HiveHubFirmwareCard
                  device={selectedDevice}
                  latest={latest}
                  hiveNames={hiveNames}
                />
                <HiveHubSdImportCard device={selectedDevice} />
                <HiveHubDataCard
                  device={selectedDevice}
                  hiveNames={hiveNames}
                  reportedHives={reportedHives}
                />
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
