import { useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  BatteryCharging,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Droplets,
  Info,
  Play,
  Plus,
  RefreshCw,
  Square,
  Thermometer,
  Trash2,
  Upload,
  UserPlus,
  Weight,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useHivesWithBoxes } from '@/api/hooks/useHives';
import {
  useApproveHiveScaleFirmware,
  useClaimHiveScaleDevice,
  useFitHiveScaleTempCompensation,
  useHiveScaleDeviceConfig,
  useHiveScaleDevices,
  useHiveScaleFirmwareStatus,
  useHiveScaleMeasurements,
  useHiveScaleMembers,
  useRemoveHiveScaleDevice,
  useRevokeHiveScaleMember,
  useShareHiveScaleDevice,
  useImportHiveScaleSdData,
  useStartHiveScaleCalibrationMode,
  useQueueHiveInsideUpdate,
  useStopHiveScaleCalibrationMode,
  useUpdateHiveScaleChannels,
  useUpdateHiveScaleConfig,
  useUploadHiveScaleFirmware,
  type HiveScaleChannelMapping,
  type HiveScaleDevice,
  type HiveScaleFirmwareTarget,
  type HiveScaleMeasurement,
  type HiveScaleTempcoSource,
  useHiveScaleInsights,
  HiveScaleInsightSeverity,
  type HiveScaleInsightAlert,
} from '@/api/hooks/useHiveScale';
import {
  createPresetDateRange,
  measurementLimitForRange,
  type HiveScaleDateRange,
  type HiveScaleDateRangePreset,
} from './hivescale-date-range';
import { HiveScaleModularDashboard } from './hivescale-modular-dashboard';
import { WirelessSensorsBattery } from './wireless-sensors-battery';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  DialogTrigger,
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
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HiveScaleAlertList,
  HiveScaleSeverityPill,
  severityConfig,
} from './hivescale-insights-card';
import { HiveScaleInsightsHistoryDialog } from './hivescale-insights-history-dialog';

const numberOrDash = (value: number | null | undefined, digits = 1) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : '—';

const MAX_HIVE_SLOTS = 18;
const HIVE_MAPPING_STORAGE_PREFIX = 'hivepal:hivescale-hive-mapping:';

type HiveMappingBySlot = Record<number, string>;

const emptyHiveMappings = (): HiveMappingBySlot =>
  Object.fromEntries(
    Array.from({ length: MAX_HIVE_SLOTS }, (_, i) => [i + 1, '']),
  ) as HiveMappingBySlot;

const normalizeHiveMappings = (
  mappings: Partial<Record<number | string, unknown>> | readonly unknown[],
): HiveMappingBySlot => {
  const rawValueForSlot = (slot: number, index: number): unknown => {
    if (Array.isArray(mappings)) return mappings[index];

    const mappingRecord = mappings as Partial<Record<string, unknown>>;
    return mappingRecord[String(slot)];
  };

  return Object.fromEntries(
    Array.from({ length: MAX_HIVE_SLOTS }, (_, i) => {
      const slot = i + 1;
      const rawValue = rawValueForSlot(slot, i);
      return [slot, typeof rawValue === 'string' ? rawValue.trim() : ''];
    }),
  ) as HiveMappingBySlot;
};

const hiveMappingStorageKey = (deviceId: string) =>
  `${HIVE_MAPPING_STORAGE_PREFIX}${deviceId}:v1`;

const readStoredHiveMappings = (deviceId: string): HiveMappingBySlot => {
  const fallback = emptyHiveMappings();
  if (typeof globalThis.window === 'undefined') return fallback;

  try {
    const raw = globalThis.localStorage.getItem(hiveMappingStorageKey(deviceId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return normalizeHiveMappings(parsed);
    if (parsed && typeof parsed === 'object') {
      const stored = 'mappings' in parsed
        ? (parsed as { mappings?: unknown }).mappings
        : parsed;
      if (Array.isArray(stored)) return normalizeHiveMappings(stored);
      if (stored && typeof stored === 'object') {
        return normalizeHiveMappings(stored as Record<string, unknown>);
      }
    }
    return fallback;
  } catch {
    return fallback;
  }
};

const saveStoredHiveMappings = (
  deviceId: string,
  mappings: HiveMappingBySlot,
) => {
  if (typeof globalThis.window === 'undefined') return;

  try {
    globalThis.localStorage.setItem(
      hiveMappingStorageKey(deviceId),
      JSON.stringify(normalizeHiveMappings(mappings)),
    );
  } catch {
    // Ignore localStorage failures, for example private mode.
  }
};

const deviceHiveMappings = (
  device: HiveScaleDevice | undefined,
): HiveMappingBySlot => {
  if (!device) return emptyHiveMappings();
  const mappings = readStoredHiveMappings(device.device_id);
  for (const mapping of device.channels?.hives ?? []) {
    if (mapping.index >= 1 && mapping.index <= MAX_HIVE_SLOTS) {
      mappings[mapping.index] = mapping.display_name?.trim() ?? '';
    }
  }
  mappings[1] = mappings[1] || device.channels?.scale_1?.trim() || '';
  mappings[2] = mappings[2] || device.channels?.scale_2?.trim() || '';
  return mappings;
};

const hiveMappingsToPayload = (
  mappings: HiveMappingBySlot,
): HiveScaleChannelMapping[] =>
  Array.from({ length: MAX_HIVE_SLOTS }, (_, i) => {
    const index = i + 1;
    const displayName = mappings[index]?.trim();
    return {
      index,
      display_name: displayName || null,
    };
  });

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

const channelName = (
  device: HiveScaleDevice | undefined,
  channelNumber: 1 | 2,
  fallback: string,
) => {
  const name =
    channelNumber === 1 ? device?.channels?.scale_1 : device?.channels?.scale_2;
  return name?.trim() || fallback;
};

function HiveNameInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  hiveNameOptions,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hiveNameOptions: string[];
}>) {
  const listId = `${id}-hive-names`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        list={listId}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <datalist id={listId}>
        {hiveNameOptions.map(name => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </div>
  );
}

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
      },
      {
        onSuccess: () => {
          setClaimCode('');
          setDisplayName('');
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

type CalibrationScaleNumber = 1 | 2;

type CapturedRawReading = {
  raw: number;
  measuredAt: string;
};

const getScaleRaw = (
  latest: HiveScaleMeasurement | undefined,
  scaleNumber: CalibrationScaleNumber,
) => (scaleNumber === 1 ? latest?.scale_1_raw : latest?.scale_2_raw);

const hasValidRaw = (raw: number | null | undefined) =>
  typeof raw === 'number' && Number.isFinite(raw);

const parsePositiveNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const formatRawCapture = (capture: CapturedRawReading | null, t: TFunction) => {
  if (!capture) return t('calibration.notCapturedYet');
  return t('calibration.rawCapture', {
    raw: capture.raw.toFixed(0),
    time: formatDateTime(capture.measuredAt, t),
  });
};

type ManualConfigInput = {
  sendInterval: string;
  scale1Offset: string;
  scale2Offset: string;
  scale1Factor: string;
  scale2Factor: string;
};

type ManualConfigResult =
  | { error: string }
  | {
      error?: undefined;
      values: {
        send_interval_seconds: number;
        scale1_offset: number;
        scale1_factor: number;
        scale2_offset: number;
        scale2_factor: number;
      };
    };

const parseManualConfig = (
  input: ManualConfigInput,
  t: TFunction,
): ManualConfigResult => {
  const parsedSendInterval = Number(input.sendInterval);
  if (
    !Number.isFinite(parsedSendInterval) ||
    !Number.isInteger(parsedSendInterval) ||
    parsedSendInterval < 60
  ) {
    return { error: t('calibration.errors.sendInterval') };
  }

  const parsedScale1Offset = Number(input.scale1Offset);
  const parsedScale2Offset = Number(input.scale2Offset);
  if (
    !Number.isFinite(parsedScale1Offset) ||
    !Number.isInteger(parsedScale1Offset) ||
    !Number.isFinite(parsedScale2Offset) ||
    !Number.isInteger(parsedScale2Offset)
  ) {
    return { error: t('calibration.errors.offsetsWhole') };
  }

  const parsedScale1Factor = Number(input.scale1Factor);
  const parsedScale2Factor = Number(input.scale2Factor);
  if (
    !Number.isFinite(parsedScale1Factor) ||
    parsedScale1Factor === 0 ||
    !Number.isFinite(parsedScale2Factor) ||
    parsedScale2Factor === 0
  ) {
    return { error: t('calibration.errors.factorsNonZero') };
  }

  return {
    values: {
      send_interval_seconds: parsedSendInterval,
      scale1_offset: parsedScale1Offset,
      scale1_factor: parsedScale1Factor,
      scale2_offset: parsedScale2Offset,
      scale2_factor: parsedScale2Factor,
    },
  };
};

const computeFactorFromKnownWeight = ({
  raw,
  offset,
  knownWeightKg,
  scaleName,
  t,
}: {
  raw: number | null | undefined;
  offset: string;
  knownWeightKg: string;
  scaleName: string;
  t: TFunction;
}): { error: string } | { error?: undefined; factor: string } => {
  if (!hasValidRaw(raw)) {
    return { error: t('calibration.errors.noLatestRaw', { scaleName }) };
  }

  const parsedOffset = Number(offset);
  if (!Number.isFinite(parsedOffset)) {
    return { error: t('calibration.errors.validOffset', { scaleName }) };
  }

  const parsedKnownWeightKg = Number(knownWeightKg);
  if (!Number.isFinite(parsedKnownWeightKg) || parsedKnownWeightKg <= 0) {
    return {
      error: t('calibration.errors.knownWeight', { scaleName }),
    };
  }

  const factor = ((raw as number) - parsedOffset) / parsedKnownWeightKg;
  if (!Number.isFinite(factor) || factor === 0) {
    return {
      error: t('calibration.errors.factorNotCalculated', { scaleName }),
    };
  }

  return { factor: Number(factor.toPrecision(12)).toString() };
};

function DeviceConfigCard({
  selectedDevice,
  deviceId,
  latest,
  onCalibrationPollingChange,
}: Readonly<{
  selectedDevice: HiveScaleDevice | undefined;
  deviceId: string | undefined;
  latest: HiveScaleMeasurement | undefined;
  onCalibrationPollingChange: (enabled: boolean) => void;
}>) {
  const { t } = useTranslation('hivescale');
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useHiveScaleDeviceConfig(deviceId);
  const updateConfig = useUpdateHiveScaleConfig(deviceId);
  const startCalibrationMode = useStartHiveScaleCalibrationMode(deviceId);
  const stopCalibrationMode = useStopHiveScaleCalibrationMode(deviceId);
  const [sendInterval, setSendInterval] = useState('');
  const [scale1Offset, setScale1Offset] = useState('');
  const [scale1Factor, setScale1Factor] = useState('');
  const [scale1KnownWeightKg, setScale1KnownWeightKg] = useState('');
  const [scale2Offset, setScale2Offset] = useState('');
  const [scale2Factor, setScale2Factor] = useState('');
  const [scale2KnownWeightKg, setScale2KnownWeightKg] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [calibrationQueued, setCalibrationQueued] = useState(false);
  const [activeScale, setActiveScale] = useState<CalibrationScaleNumber>(1);
  const [emptyCapture, setEmptyCapture] = useState<CapturedRawReading | null>(
    null,
  );
  const [loadedCapture, setLoadedCapture] = useState<CapturedRawReading | null>(
    null,
  );
  const [knownWeightKg, setKnownWeightKg] = useState('');

  useEffect(() => {
    if (!config) return;
    setSendInterval(String(config.send_interval_seconds));
    setScale1Offset(String(config.scale1_offset));
    setScale1Factor(String(config.scale1_factor));
    setScale2Offset(String(config.scale2_offset));
    setScale2Factor(String(config.scale2_factor));
  }, [config]);

  useEffect(() => {
    setEmptyCapture(null);
    setLoadedCapture(null);
    setKnownWeightKg('');
  }, [activeScale, deviceId]);

  useEffect(() => {
    if (latest?.calibration_mode === true) {
      setCalibrationQueued(false);
      onCalibrationPollingChange(true);
    }
  }, [latest?.calibration_mode, onCalibrationPollingChange]);

  const canConfigure =
    selectedDevice?.role === 'owner' || selectedDevice?.role === 'admin';
  const scale1Name = channelName(selectedDevice, 1, t('common.scale1'));
  const scale2Name = channelName(selectedDevice, 2, t('common.scale2'));
  const activeScaleName = activeScale === 1 ? scale1Name : scale2Name;
  const latestRaw = getScaleRaw(latest, activeScale);
  const hasLatestRaw = hasValidRaw(latestRaw);
  const hasLatestMeasurement = Boolean(latest?.measured_at);
  const isCalibrationModeActive = latest?.calibration_mode === true;
  const knownWeight = parsePositiveNumber(knownWeightKg);

  const calculatedFactor = useMemo(() => {
    if (!emptyCapture || !loadedCapture || knownWeight === null) return null;
    const factor = (loadedCapture.raw - emptyCapture.raw) / knownWeight;
    if (!Number.isFinite(factor) || factor === 0) return null;
    return Number(factor.toPrecision(12));
  }, [emptyCapture, knownWeight, loadedCapture]);

  const invalidateHiveScaleData = () => {
    queryClient.invalidateQueries({ queryKey: ['hivescale'] });
  };

  const startFastMode = () => {
    if (!canConfigure) return;
    startCalibrationMode.mutate(
      { interval_seconds: 5, timeout_seconds: 600 },
      {
        onSuccess: () => {
          setCalibrationQueued(true);
          onCalibrationPollingChange(true);
          invalidateHiveScaleData();
          toast.success(t('calibration.toasts.modeQueued'));
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const stopFastMode = (showToast = true) => {
    if (!canConfigure) return;
    stopCalibrationMode.mutate(undefined, {
      onSuccess: () => {
        setCalibrationQueued(false);
        invalidateHiveScaleData();
        if (showToast) {
          toast.success(t('calibration.toasts.stopQueued'));
        }
      },
      onError: error => toast.error(error.message),
    });
  };

  const captureLatestRaw = (
    type: 'empty' | 'loaded',
  ): CapturedRawReading | null => {
    if (!isCalibrationModeActive) {
      toast.error(t('calibration.toasts.startModeFirst'));
      return null;
    }

    if (!latest?.measured_at || !hasValidRaw(latestRaw)) {
      toast.error(
        t('calibration.errors.noLatestRaw', { scaleName: activeScaleName }),
      );
      return null;
    }

    if (type === 'loaded') {
      if (!emptyCapture) {
        toast.error(t('calibration.toasts.captureEmptyFirst'));
        return null;
      }
      if (knownWeight === null) {
        toast.error(t('calibration.toasts.enterKnownWeightFirst'));
        return null;
      }
      if (
        new Date(latest.measured_at).getTime() <=
        new Date(emptyCapture.measuredAt).getTime()
      ) {
        toast.error(t('calibration.toasts.waitForNewReading'));
        return null;
      }
    }

    return { raw: latestRaw as number, measuredAt: latest.measured_at };
  };

  const captureEmptyRaw = () => {
    const capture = captureLatestRaw('empty');
    if (!capture) return;
    setEmptyCapture(capture);
    setLoadedCapture(null);
    toast.success(
      t('calibration.toasts.emptyCaptured', { scaleName: activeScaleName }),
    );
  };

  const captureLoadedRaw = () => {
    const capture = captureLatestRaw('loaded');
    if (!capture) return;
    setLoadedCapture(capture);
    toast.success(
      t('calibration.toasts.weightedCaptured', { scaleName: activeScaleName }),
    );
  };

  const saveWizardCalibration = () => {
    if (!config || !emptyCapture || calculatedFactor === null) return;

    const patch =
      activeScale === 1
        ? {
            scale1_offset: Math.round(emptyCapture.raw),
            scale1_factor: calculatedFactor,
          }
        : {
            scale2_offset: Math.round(emptyCapture.raw),
            scale2_factor: calculatedFactor,
          };

    updateConfig.mutate(patch, {
      onSuccess: () => {
        if (activeScale === 1) {
          setScale1Offset(String(Math.round(emptyCapture.raw)));
          setScale1Factor(String(calculatedFactor));
        } else {
          setScale2Offset(String(Math.round(emptyCapture.raw)));
          setScale2Factor(String(calculatedFactor));
        }
        toast.success(
          t('calibration.toasts.calibrationSaved', {
            scaleName: activeScaleName,
          }),
        );
        stopFastMode(false);
        setIsWizardOpen(false);
      },
      onError: error => toast.error(error.message),
    });
  };

  const saveConfig = () => {
    if (!deviceId) return;

    const result = parseManualConfig(
      {
        sendInterval,
        scale1Offset,
        scale2Offset,
        scale1Factor,
        scale2Factor,
      },
      t,
    );
    if (result.error !== undefined) {
      toast.error(result.error);
      return;
    }

    updateConfig.mutate(result.values, {
      onSuccess: () => toast.success(t('calibration.toasts.configUpdated')),
      onError: error => toast.error(error.message),
    });
  };

  if (!deviceId) return null;

  const latestScale1Raw = latest?.scale_1_raw;
  const latestScale2Raw = latest?.scale_2_raw;
  const hasLatestScale1Raw = hasValidRaw(latestScale1Raw);
  const hasLatestScale2Raw = hasValidRaw(latestScale2Raw);

  const setLatestRawAsOffset = (
    raw: number | null | undefined,
    setOffset: (value: string) => void,
    scaleName: string,
  ) => {
    if (!hasValidRaw(raw)) {
      toast.error(t('calibration.errors.noLatestRaw', { scaleName }));
      return;
    }
    setOffset(String(raw as number));
    toast.success(t('calibration.toasts.offsetSet', { scaleName }));
  };

  const calculateFactorFromKnownWeight = ({
    raw,
    offset,
    knownWeightKg,
    setFactor,
    scaleName,
  }: {
    raw: number | null | undefined;
    offset: string;
    knownWeightKg: string;
    setFactor: (value: string) => void;
    scaleName: string;
  }) => {
    const result = computeFactorFromKnownWeight({
      raw,
      offset,
      knownWeightKg,
      scaleName,
      t,
    });
    if (result.error !== undefined) {
      toast.error(result.error);
      return;
    }

    setFactor(result.factor);
    toast.success(
      t('calibration.toasts.factorCalculated', {
        scaleName,
        factor: result.factor,
      }),
    );
  };

  const pendingAction =
    updateConfig.isPending ||
    startCalibrationMode.isPending ||
    stopCalibrationMode.isPending;

  let calibrationModeBadgeLabel: string;
  let calibrationModeDescription: string;
  if (isCalibrationModeActive) {
    calibrationModeBadgeLabel = t('calibration.mode.activeBadge');
    calibrationModeDescription = t('calibration.mode.activeDescription');
  } else if (calibrationQueued) {
    calibrationModeBadgeLabel = t('calibration.mode.queuedBadge');
    calibrationModeDescription = t('calibration.mode.queuedDescription');
  } else {
    calibrationModeBadgeLabel = t('calibration.mode.offBadge');
    calibrationModeDescription = t('calibration.mode.offDescription');
  }

  let wizardAlertTitle: string;
  let wizardAlertDescription: string;
  if (isCalibrationModeActive) {
    wizardAlertTitle = t('calibration.wizard.alertActiveTitle');
    wizardAlertDescription = t('calibration.wizard.alertActiveDescription', {
      time: formatDateTime(latest?.measured_at, t),
    });
  } else if (calibrationQueued) {
    wizardAlertTitle = t('calibration.wizard.alertQueuedTitle');
    wizardAlertDescription = t('calibration.wizard.alertQueuedDescription');
  } else {
    wizardAlertTitle = t('calibration.wizard.alertStartTitle');
    wizardAlertDescription = t('calibration.wizard.alertStartDescription');
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{t('calibration.title')}</CardTitle>
            <CardDescription>{t('calibration.subtitle')}</CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label={t('calibration.instructionsAria')}
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              align="start"
              className="max-w-sm space-y-2 text-left"
            >
              <p className="font-medium">{t('calibration.workflow.title')}</p>
              <ol className="list-decimal space-y-1 pl-4">
                <li>{t('calibration.workflow.step1')}</li>
                <li>{t('calibration.workflow.step2')}</li>
                <li>{t('calibration.workflow.step3')}</li>
                <li>{t('calibration.workflow.step4')}</li>
                <li>{t('calibration.workflow.step5')}</li>
              </ol>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : config ? (
          <>
            <div className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{t('calibration.mode.title')}</p>
                  <p className="text-xs text-muted-foreground">
                    {calibrationModeDescription}
                  </p>
                </div>
                <Badge
                  variant={isCalibrationModeActive ? 'default' : 'secondary'}
                  className="shrink-0"
                >
                  {calibrationModeBadgeLabel}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">
                    {scale1Name}
                  </span>
                  <br />
                  {t('calibration.raw', {
                    value: numberOrDash(latestScale1Raw, 0),
                  })}
                </div>
                <div>
                  <span className="font-medium text-foreground">
                    {scale2Name}
                  </span>
                  <br />
                  {t('calibration.raw', {
                    value: numberOrDash(latestScale2Raw, 0),
                  })}
                </div>
              </div>
            </div>

            <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" disabled={!canConfigure}>
                  <Zap className="mr-2 h-4 w-4" />
                  {t('calibration.openWizard')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{t('calibration.wizard.title')}</DialogTitle>
                  <DialogDescription>
                    {t('calibration.wizard.description')}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertTitle>{wizardAlertTitle}</AlertTitle>
                    <AlertDescription>
                      {wizardAlertDescription}
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={startFastMode}
                      disabled={
                        !canConfigure ||
                        isCalibrationModeActive ||
                        startCalibrationMode.isPending
                      }
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {startCalibrationMode.isPending
                        ? t('calibration.wizard.starting')
                        : isCalibrationModeActive
                          ? t('calibration.wizard.fastModeActive')
                          : t('calibration.wizard.startFastMode')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => stopFastMode()}
                      disabled={!canConfigure || stopCalibrationMode.isPending}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      {stopCalibrationMode.isPending
                        ? t('calibration.wizard.stopping')
                        : t('calibration.wizard.stopFastMode')}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('calibration.wizard.whichScale')}</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {([1, 2] as CalibrationScaleNumber[]).map(scaleNumber => {
                        const name =
                          scaleNumber === 1 ? scale1Name : scale2Name;
                        const raw = getScaleRaw(latest, scaleNumber);
                        const isSelected = activeScale === scaleNumber;
                        return (
                          <Button
                            key={scaleNumber}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            className="h-auto justify-start p-3 text-left"
                            onClick={() => setActiveScale(scaleNumber)}
                          >
                            <Weight className="mr-2 h-4 w-4 shrink-0" />
                            <span>
                              <span className="block font-medium">{name}</span>
                              <span className="block text-xs opacity-80">
                                {t('calibration.wizard.latestRaw', {
                                  value: numberOrDash(raw, 0),
                                })}
                              </span>
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-3 rounded-md border p-3">
                      <div className="flex items-start gap-2">
                        <Badge variant={emptyCapture ? 'default' : 'secondary'}>
                          1
                        </Badge>
                        <div>
                          <p className="font-medium">
                            {t('calibration.wizard.emptyScale')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('calibration.wizard.emptyScaleHint', {
                              scaleName: activeScaleName,
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('calibration.wizard.captured', {
                          value: formatRawCapture(emptyCapture, t),
                        })}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={captureEmptyRaw}
                        disabled={
                          !isCalibrationModeActive ||
                          !hasLatestRaw ||
                          !hasLatestMeasurement
                        }
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {t('calibration.wizard.captureEmptyRaw')}
                      </Button>
                    </div>

                    <div className="space-y-3 rounded-md border p-3">
                      <div className="flex items-start gap-2">
                        <Badge
                          variant={loadedCapture ? 'default' : 'secondary'}
                        >
                          2
                        </Badge>
                        <div>
                          <p className="font-medium">
                            {t('calibration.wizard.knownWeight')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('calibration.wizard.knownWeightHint')}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wizard-known-weight">
                          {t('calibration.wizard.weightKg')}
                        </Label>
                        <Input
                          id="wizard-known-weight"
                          type="number"
                          min="0"
                          step="any"
                          value={knownWeightKg}
                          onChange={event => {
                            setKnownWeightKg(event.target.value);
                            setLoadedCapture(null);
                          }}
                          placeholder="e.g. 10"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('calibration.wizard.captured', {
                          value: formatRawCapture(loadedCapture, t),
                        })}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={captureLoadedRaw}
                        disabled={
                          !emptyCapture ||
                          knownWeight === null ||
                          !isCalibrationModeActive ||
                          !hasLatestRaw ||
                          !hasLatestMeasurement
                        }
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {t('calibration.wizard.captureWeightRaw')}
                      </Button>
                    </div>

                    <div className="space-y-3 rounded-md border p-3">
                      <div className="flex items-start gap-2">
                        <Badge
                          variant={
                            calculatedFactor !== null ? 'default' : 'secondary'
                          }
                        >
                          3
                        </Badge>
                        <div>
                          <p className="font-medium">
                            {t('calibration.wizard.saveResult')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('calibration.wizard.saveResultHint')}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        <p className="text-xs text-muted-foreground">
                          {t('calibration.wizard.offset')}
                        </p>
                        <p className="font-mono">
                          {emptyCapture ? Math.round(emptyCapture.raw) : '—'}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {t('calibration.wizard.factorRawPerKg')}
                        </p>
                        <p className="font-mono">
                          {calculatedFactor !== null ? calculatedFactor : '—'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        className="w-full"
                        onClick={saveWizardCalibration}
                        disabled={
                          !canConfigure ||
                          calculatedFactor === null ||
                          pendingAction
                        }
                      >
                        {updateConfig.isPending
                          ? t('common.saving')
                          : t('calibration.wizard.saveAndStop')}
                      </Button>
                    </div>
                  </div>

                  {emptyCapture &&
                    loadedCapture &&
                    calculatedFactor === null && (
                      <Alert variant="destructive">
                        <Info className="h-4 w-4" />
                        <AlertTitle>
                          {t('calibration.wizard.noChangeTitle')}
                        </AlertTitle>
                        <AlertDescription>
                          {t('calibration.wizard.noChangeDescription')}
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              </DialogContent>
            </Dialog>

            {!canConfigure && (
              <p className="text-xs text-muted-foreground">
                {t('calibration.viewerNotice')}
              </p>
            )}

            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between px-0"
                >
                  {t('calibration.advanced.title')}
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${
                      isAdvancedOpen ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-5 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="send-interval">
                    {t('calibration.advanced.sendInterval')}
                  </Label>
                  <Input
                    id="send-interval"
                    type="number"
                    min={60}
                    step={1}
                    value={sendInterval}
                    onChange={event => setSendInterval(event.target.value)}
                    disabled={!canConfigure}
                  />
                </div>

                <div className="space-y-3 rounded-md border p-3">
                  <div>
                    <p className="font-medium">
                      {t('calibration.advanced.manualValues', {
                        scaleName: scale1Name,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('calibration.advanced.latestRawHint', {
                        value: numberOrDash(latestScale1Raw, 0),
                      })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scale-1-offset">
                      {t('calibration.advanced.offsetLabel')}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="scale-1-offset"
                        type="number"
                        step={1}
                        value={scale1Offset}
                        onChange={event => setScale1Offset(event.target.value)}
                        disabled={!canConfigure}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!canConfigure || !hasLatestScale1Raw}
                        onClick={() =>
                          setLatestRawAsOffset(
                            latestScale1Raw,
                            setScale1Offset,
                            scale1Name,
                          )
                        }
                      >
                        {t('calibration.advanced.useLatest')}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scale-1-known-weight">
                      {t('calibration.advanced.knownWeightLabel')}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="scale-1-known-weight"
                        type="number"
                        step="any"
                        value={scale1KnownWeightKg}
                        onChange={event =>
                          setScale1KnownWeightKg(event.target.value)
                        }
                        placeholder="e.g. 10"
                        disabled={!canConfigure}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!canConfigure || !hasLatestScale1Raw}
                        onClick={() =>
                          calculateFactorFromKnownWeight({
                            raw: latestScale1Raw,
                            offset: scale1Offset,
                            knownWeightKg: scale1KnownWeightKg,
                            setFactor: setScale1Factor,
                            scaleName: scale1Name,
                          })
                        }
                      >
                        {t('calibration.advanced.calculate')}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scale-1-factor">
                      {t('calibration.advanced.factorLabel')}
                    </Label>
                    <Input
                      id="scale-1-factor"
                      type="number"
                      step="any"
                      value={scale1Factor}
                      onChange={event => setScale1Factor(event.target.value)}
                      disabled={!canConfigure}
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-md border p-3">
                  <div>
                    <p className="font-medium">
                      {t('calibration.advanced.manualValues', {
                        scaleName: scale2Name,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('calibration.advanced.latestRawHint', {
                        value: numberOrDash(latestScale2Raw, 0),
                      })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scale-2-offset">
                      {t('calibration.advanced.offsetLabel')}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="scale-2-offset"
                        type="number"
                        step={1}
                        value={scale2Offset}
                        onChange={event => setScale2Offset(event.target.value)}
                        disabled={!canConfigure}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!canConfigure || !hasLatestScale2Raw}
                        onClick={() =>
                          setLatestRawAsOffset(
                            latestScale2Raw,
                            setScale2Offset,
                            scale2Name,
                          )
                        }
                      >
                        {t('calibration.advanced.useLatest')}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scale-2-known-weight">
                      {t('calibration.advanced.knownWeightLabel')}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="scale-2-known-weight"
                        type="number"
                        step="any"
                        value={scale2KnownWeightKg}
                        onChange={event =>
                          setScale2KnownWeightKg(event.target.value)
                        }
                        placeholder="e.g. 10"
                        disabled={!canConfigure}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!canConfigure || !hasLatestScale2Raw}
                        onClick={() =>
                          calculateFactorFromKnownWeight({
                            raw: latestScale2Raw,
                            offset: scale2Offset,
                            knownWeightKg: scale2KnownWeightKg,
                            setFactor: setScale2Factor,
                            scaleName: scale2Name,
                          })
                        }
                      >
                        {t('calibration.advanced.calculate')}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scale-2-factor">
                      {t('calibration.advanced.factorLabel')}
                    </Label>
                    <Input
                      id="scale-2-factor"
                      type="number"
                      step="any"
                      value={scale2Factor}
                      onChange={event => setScale2Factor(event.target.value)}
                      disabled={!canConfigure}
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={saveConfig}
                  disabled={!canConfigure || updateConfig.isPending}
                >
                  {updateConfig.isPending
                    ? t('common.saving')
                    : t('calibration.advanced.saveManual')}
                </Button>
                <div className="text-xs text-muted-foreground">
                  {t('calibration.advanced.configVersion', {
                    version: config.config_version,
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('calibration.noConfig')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TempCompensationCard({
  selectedDevice,
  deviceId,
}: Readonly<{
  selectedDevice: HiveScaleDevice | undefined;
  deviceId: string | undefined;
}>) {
  const { t } = useTranslation('hivescale');
  const { data: config, isLoading } = useHiveScaleDeviceConfig(deviceId);
  const updateConfig = useUpdateHiveScaleConfig(deviceId);
  const fitTempco = useFitHiveScaleTempCompensation(deviceId);
  // Load-cell temperature compensation (applied in the HiveScale backend).
  const [tempcoEnabled, setTempcoEnabled] = useState(false);
  const [tempcoSource, setTempcoSource] =
    useState<HiveScaleTempcoSource>('ambient');
  const [tempcoRefTemp, setTempcoRefTemp] = useState('');
  const [scale1Tempco, setScale1Tempco] = useState('');
  const [scale2Tempco, setScale2Tempco] = useState('');

  useEffect(() => {
    if (!config) return;
    setTempcoEnabled(Boolean(config.tempco_enabled));
    setTempcoSource(config.tempco_source ?? 'ambient');
    setTempcoRefTemp(String(config.tempco_ref_temp_c ?? 20));
    setScale1Tempco(String(config.scale1_tempco_kg_per_c ?? 0));
    setScale2Tempco(String(config.scale2_tempco_kg_per_c ?? 0));
  }, [config]);

  if (!deviceId) return null;

  const canConfigure =
    selectedDevice?.role === 'owner' || selectedDevice?.role === 'admin';
  const scale1Name = channelName(selectedDevice, 1, t('common.scale1'));
  const scale2Name = channelName(selectedDevice, 2, t('common.scale2'));

  const saveTempco = () => {
    const parsedRef = Number(tempcoRefTemp);
    if (!Number.isFinite(parsedRef)) {
      toast.error(t('calibration.tempco.errors.refTemp'));
      return;
    }

    const parsedScale1 = Number(scale1Tempco);
    const parsedScale2 = Number(scale2Tempco);
    if (!Number.isFinite(parsedScale1) || !Number.isFinite(parsedScale2)) {
      toast.error(t('calibration.tempco.errors.coeff'));
      return;
    }

    updateConfig.mutate(
      {
        tempco_enabled: tempcoEnabled,
        tempco_source: tempcoSource,
        tempco_ref_temp_c: parsedRef,
        scale1_tempco_kg_per_c: parsedScale1,
        scale2_tempco_kg_per_c: parsedScale2,
      },
      {
        onSuccess: () => toast.success(t('calibration.tempco.toasts.saved')),
        onError: error => toast.error(error.message),
      },
    );
  };

  const autoFitTempco = (scale: CalibrationScaleNumber) => {
    const scaleName = scale === 1 ? scale1Name : scale2Name;

    fitTempco.mutate(
      {
        scale,
        lookback_days: 3,
        temp_source: tempcoSource,
        calibration_mode_only: false,
        apply: true,
      },
      {
        onSuccess: result => {
          if (!result.ok) {
            toast.error(
              t('calibration.tempco.toasts.fitFailed', {
                scaleName,
                reason:
                  result.reason ?? t('calibration.tempco.toasts.noSignal'),
              }),
            );
            return;
          }
          const r2 =
            result.r_squared === null ? 'n/a' : result.r_squared.toFixed(2);
          toast.success(
            t('calibration.tempco.toasts.fitApplied', {
              scaleName,
              coeff: result.coeff_kg_per_c.toFixed(4),
              refTemp: result.ref_temp_c.toFixed(1),
              r2,
              n: result.n,
            }),
          );
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="h-4 w-4" />
          {t('calibration.tempco.title')}
        </CardTitle>
        <CardDescription>{t('calibration.tempco.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : config ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="tempco-enabled">
                {t('calibration.tempco.enableAria')}
              </Label>
              <Switch
                id="tempco-enabled"
                checked={tempcoEnabled}
                onCheckedChange={setTempcoEnabled}
                disabled={!canConfigure}
                aria-label={t('calibration.tempco.enableAria')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tempco-source">
                {t('calibration.tempco.sourceLabel')}
              </Label>
              <Select
                value={tempcoSource}
                onValueChange={value =>
                  setTempcoSource(value as HiveScaleTempcoSource)
                }
                disabled={!canConfigure}
              >
                <SelectTrigger id="tempco-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambient">
                    {t('calibration.tempco.source.ambient')}
                  </SelectItem>
                  <SelectItem value="hive_1">
                    {t('calibration.tempco.source.hive1')}
                  </SelectItem>
                  <SelectItem value="hive_2">
                    {t('calibration.tempco.source.hive2')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('calibration.tempco.sourceHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tempco-ref">
                {t('calibration.tempco.refLabel')}
              </Label>
              <Input
                id="tempco-ref"
                type="number"
                step="any"
                value={tempcoRefTemp}
                onChange={event => setTempcoRefTemp(event.target.value)}
                disabled={!canConfigure}
              />
              <p className="text-xs text-muted-foreground">
                {t('calibration.tempco.refHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scale-1-tempco">
                {t('calibration.tempco.coeffLabel', { scaleName: scale1Name })}
              </Label>
              <Input
                id="scale-1-tempco"
                type="number"
                step="any"
                value={scale1Tempco}
                onChange={event => setScale1Tempco(event.target.value)}
                disabled={!canConfigure}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => autoFitTempco(1)}
                disabled={!canConfigure || fitTempco.isPending}
              >
                {fitTempco.isPending
                  ? t('calibration.tempco.fitting')
                  : t('calibration.tempco.autoFit')}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scale-2-tempco">
                {t('calibration.tempco.coeffLabel', { scaleName: scale2Name })}
              </Label>
              <Input
                id="scale-2-tempco"
                type="number"
                step="any"
                value={scale2Tempco}
                onChange={event => setScale2Tempco(event.target.value)}
                disabled={!canConfigure}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => autoFitTempco(2)}
                disabled={!canConfigure || fitTempco.isPending}
              >
                {fitTempco.isPending
                  ? t('calibration.tempco.fitting')
                  : t('calibration.tempco.autoFit')}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('calibration.tempco.autoFitHint')}
            </p>

            <Button
              className="w-full"
              onClick={saveTempco}
              disabled={!canConfigure || updateConfig.isPending}
            >
              {updateConfig.isPending
                ? t('common.saving')
                : t('calibration.tempco.save')}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('calibration.noConfig')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ScaleMappingCard({
  selectedDevice,
  hiveNameOptions,
  hiveMappings,
  onHiveMappingsChange,
}: Readonly<{
  selectedDevice: HiveScaleDevice | undefined;
  hiveNameOptions: string[];
  hiveMappings: HiveMappingBySlot;
  onHiveMappingsChange: (mappings: HiveMappingBySlot) => void;
}>) {
  const { t } = useTranslation('hivescale');
  const updateChannels = useUpdateHiveScaleChannels(selectedDevice?.device_id);
  const [draftMappings, setDraftMappings] = useState<HiveMappingBySlot>(() =>
    normalizeHiveMappings(hiveMappings),
  );
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editingHiveName, setEditingHiveName] = useState('');

  useEffect(() => {
    setDraftMappings(normalizeHiveMappings(hiveMappings));
  }, [hiveMappings]);

  if (!selectedDevice || selectedDevice.role === 'viewer') return null;

  const openSlotEditor = (slot: number) => {
    setEditingSlot(slot);
    setEditingHiveName(draftMappings[slot] ?? '');
  };

  const closeSlotEditor = () => {
    setEditingSlot(null);
    setEditingHiveName('');
  };

  const updateSlotMapping = (slot: number, value: string) => {
    setDraftMappings(current => ({
      ...current,
      [slot]: value.trim(),
    }));
  };

  const saveSlotMapping = () => {
    if (editingSlot === null) return;
    updateSlotMapping(editingSlot, editingHiveName);
    closeSlotEditor();
  };

  const clearSlotMapping = () => {
    if (editingSlot === null) return;
    updateSlotMapping(editingSlot, '');
    closeSlotEditor();
  };

  const saveMapping = () => {
    const normalized = normalizeHiveMappings(draftMappings);
    onHiveMappingsChange(normalized);
    saveStoredHiveMappings(selectedDevice.device_id, normalized);

    updateChannels.mutate(
      {
        scale_1_display_name: normalized[1] || undefined,
        scale_2_display_name: normalized[2] || undefined,
        hives: hiveMappingsToPayload(normalized),
      },
      {
        onSuccess: () => toast.success(t('mapping.success')),
        onError: error => toast.error(error.message),
      },
    );
  };

  const mappedCount = Object.values(draftMappings).filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('mapping.title')}</CardTitle>
        <CardDescription>
          Map HiveHub slots to HivePal hives. Only mapped slots appear in the
          hive overview and hive-based dashboard widgets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {Array.from({ length: MAX_HIVE_SLOTS }, (_, index) => {
            const slot = index + 1;
            const name = draftMappings[slot]?.trim();
            return (
              <button
                key={slot}
                type="button"
                onClick={() => openSlotEditor(slot)}
                className={`flex h-14 flex-col justify-between rounded-md border p-2 text-left transition hover:border-primary hover:bg-muted/50 ${
                  name ? 'bg-card' : 'border-dashed bg-muted/20 text-muted-foreground'
                }`}
                title={name || `Map slot ${slot}`}
              >
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {slot}
                </span>
                {name ? (
                  <span className="truncate text-xs font-medium text-foreground">
                    {name}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {mappedCount}/{MAX_HIVE_SLOTS} slots mapped
          </p>
          <Button onClick={saveMapping} disabled={updateChannels.isPending}>
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
                {editingSlot === null
                  ? 'Map HiveHub slot'
                  : `Map HiveHub slot ${editingSlot}`}
              </DialogTitle>
              <DialogDescription>
                Select an existing HivePal hive or type a new display name.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={event => {
                event.preventDefault();
                saveSlotMapping();
              }}
            >
              <HiveNameInput
                id={`mapping-slot-${editingSlot ?? 'new'}`}
                label="HivePal hive"
                value={editingHiveName}
                onChange={setEditingHiveName}
                placeholder={t('mapping.hiveNamePlaceholder')}
                hiveNameOptions={hiveNameOptions}
              />
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearSlotMapping}
                  disabled={editingSlot === null}
                >
                  Clear slot
                </Button>
                <Button type="submit">Save slot</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
            <span>{selectedDevice.role}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              {t('status.lastMeasurement')}
            </span>
            <span className="text-right">
              {formatDateTime(latest?.measured_at, t)}
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
                      {member.email} · {member.role}
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

function FirmwareUpdateStatusSection({
  selectedDevice,
  deviceId,
}: Readonly<{
  selectedDevice: HiveScaleDevice | undefined;
  deviceId: string | undefined;
}>) {
  const { t } = useTranslation('hivescale');
  const role = selectedDevice?.role;
  const canManage = role === 'owner' || role === 'admin';

  const statusQuery = useHiveScaleFirmwareStatus(deviceId, {
    enabled: !!selectedDevice,
  });
  const approveFirmware = useApproveHiveScaleFirmware(deviceId);

  if (!selectedDevice) return null;

  const status = statusQuery.data;

  const onApply = () => {
    approveFirmware.mutate(undefined, {
      onSuccess: result =>
        toast.success(
          t('firmware.update.applied', { version: result.version }),
        ),
      onError: error => toast.error(error.message),
    });
  };

  let body: ReactNode;
  if (statusQuery.isLoading) {
    body = (
      <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
    );
  } else if (!status) {
    body = (
      <p className="text-sm text-muted-foreground">
        {t('firmware.update.unavailable')}
      </p>
    );
  } else if (status.update_available && status.pending_approval) {
    body = (
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {t('firmware.update.availableTitle', {
                version: status.latest_version,
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('firmware.update.availableBody', {
                current: status.current_version ?? '—',
                version: status.latest_version,
              })}
              {status.latest_is_official
                ? ` ${t('firmware.update.officialSuffix')}`
                : ''}
            </p>
          </div>
        </div>
        {canManage ? (
          <Button
            type="button"
            className="w-full"
            onClick={onApply}
            disabled={approveFirmware.isPending}
          >
            {approveFirmware.isPending
              ? t('firmware.update.applying')
              : t('firmware.update.apply')}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('firmware.update.viewerNotice')}
          </p>
        )}
      </div>
    );
  } else if (status.update_available && !status.pending_approval) {
    body = (
      <div className="flex items-start gap-2 rounded-md border p-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <p className="text-sm text-muted-foreground">
          {t('firmware.update.queued', { version: status.latest_version })}
        </p>
      </div>
    );
  } else {
    body = (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <p className="text-sm text-muted-foreground">
          {t('firmware.update.upToDate', {
            version: status.current_version ?? '—',
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-start gap-2">
        <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-sm font-medium">{t('firmware.update.title')}</p>
          <p className="text-xs text-muted-foreground">
            {t('firmware.update.description')}
          </p>
        </div>
      </div>
      {body}
    </div>
  );
}

function FirmwareUploadCard({
  selectedDevice,
  deviceId,
}: Readonly<{
  selectedDevice: HiveScaleDevice | undefined;
  deviceId: string | undefined;
}>) {
  const { t } = useTranslation('hivescale');
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [target, setTarget] = useState<HiveScaleFirmwareTarget>('hivehub');
  // Reset key lets us clear the native file input after a successful upload.
  const [fileInputKey, setFileInputKey] = useState(0);

  const uploadFirmware = useUploadHiveScaleFirmware(deviceId);
  const queueHiveInsideUpdate = useQueueHiveInsideUpdate(deviceId);
  const [otaSlot, setOtaSlot] = useState<'1' | '2'>('1');

  const role = selectedDevice?.role;
  const canManage = role === 'owner' || role === 'admin';
  const disabled = !selectedDevice || !canManage;

  const onQueueHiveInsideOta = () => {
    if (disabled) return;
    queueHiveInsideUpdate.mutate(
      { slot: Number(otaSlot) as 1 | 2 },
      {
        onSuccess: () =>
          toast.success(t('firmware.hiveinsideOta.success', { slot: otaSlot })),
        onError: error => toast.error(error.message),
      },
    );
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (disabled) return;

    if (!file) {
      toast.error(t('firmware.errors.missingFile'));
      return;
    }
    const normalizedVersion = version.trim();
    if (!normalizedVersion) {
      toast.error(t('firmware.errors.missingVersion'));
      return;
    }

    uploadFirmware.mutate(
      { file, version: normalizedVersion, target, active: true },
      {
        onSuccess: result => {
          setFile(null);
          setVersion('');
          setFileInputKey(key => key + 1);
          toast.success(
            t('firmware.success', {
              version: result.version,
              target: result.target,
            }),
          );
          // HiveInside uploads also auto-queue the OTA relay to both slots on
          // the backend; surface which slots were queued (or failed).
          const autoQueued = result.auto_queued_updates ?? [];
          const queuedSlots = autoQueued
            .filter(update => update.status === 'queued')
            .map(update => update.slot);
          const failedSlots = autoQueued
            .filter(update => update.status === 'failed')
            .map(update => update.slot);
          if (queuedSlots.length > 0) {
            toast.success(
              t('firmware.hiveinsideOta.autoQueued', {
                slots: queuedSlots.join(', '),
              }),
            );
          }
          if (failedSlots.length > 0) {
            toast.error(
              t('firmware.hiveinsideOta.autoQueueFailed', {
                slots: failedSlots.join(', '),
              }),
            );
          }
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  let firmwareNotice: ReactNode = null;
  if (selectedDevice) {
    if (!canManage) {
      firmwareNotice = (
        <p className="text-sm text-muted-foreground">
          {t('firmware.notice.noPermission', { role })}
        </p>
      );
    }
  } else {
    firmwareNotice = (
      <p className="text-sm text-muted-foreground">
        {t('firmware.notice.selectDevice')}
      </p>
    );
  }

  return (
    <Card className={disabled ? 'opacity-60' : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {t('firmware.title')}
        </CardTitle>
        <CardDescription>{t('firmware.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {firmwareNotice}

        {selectedDevice && (
          <div className="mb-6">
            <FirmwareUpdateStatusSection
              selectedDevice={selectedDevice}
              deviceId={deviceId}
            />
          </div>
        )}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="firmware-target">{t('firmware.type')}</Label>
            <Select
              value={target}
              onValueChange={value =>
                setTarget(value as HiveScaleFirmwareTarget)
              }
              disabled={disabled || uploadFirmware.isPending}
            >
              <SelectTrigger id="firmware-target">
                <SelectValue placeholder={t('firmware.selectType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hivehub">HiveHub</SelectItem>
                <SelectItem value="beecounter">BeeCounter</SelectItem>
                <SelectItem value="hiveinside">HiveInside</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="firmware-version">{t('firmware.version')}</Label>
            <Input
              id="firmware-version"
              value={version}
              onChange={event => setVersion(event.target.value)}
              placeholder="0.6.3"
              disabled={disabled || uploadFirmware.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firmware-file">{t('firmware.binary')}</Label>
            <Input
              key={fileInputKey}
              id="firmware-file"
              type="file"
              accept=".bin,application/octet-stream"
              onChange={event => setFile(event.target.files?.[0] ?? null)}
              disabled={disabled || uploadFirmware.isPending}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={disabled || uploadFirmware.isPending}
          >
            {uploadFirmware.isPending
              ? t('firmware.uploading')
              : t('firmware.upload')}
          </Button>
        </form>

        {target === 'hiveinside' && (
          <div className="mt-6 space-y-3 border-t pt-4">
            <div className="space-y-1">
              <Label>{t('firmware.hiveinsideOta.title')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('firmware.hiveinsideOta.description')}
              </p>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="hiveinside-ota-slot">
                  {t('firmware.hiveinsideOta.slot')}
                </Label>
                <Select
                  value={otaSlot}
                  onValueChange={value => setOtaSlot(value as '1' | '2')}
                  disabled={disabled || queueHiveInsideUpdate.isPending}
                >
                  <SelectTrigger id="hiveinside-ota-slot">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">
                      {t('firmware.hiveinsideOta.slotOption', { slot: 1 })}
                    </SelectItem>
                    <SelectItem value="2">
                      {t('firmware.hiveinsideOta.slotOption', { slot: 2 })}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={onQueueHiveInsideOta}
                disabled={disabled || queueHiveInsideUpdate.isPending}
              >
                {queueHiveInsideUpdate.isPending
                  ? t('firmware.hiveinsideOta.queueing')
                  : t('firmware.hiveinsideOta.queue')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SdDataUploadCard({
  selectedDevice,
  deviceId,
}: Readonly<{
  selectedDevice: HiveScaleDevice | undefined;
  deviceId: string | undefined;
}>) {
  const { t } = useTranslation('hivescale');
  const [file, setFile] = useState<File | null>(null);
  // Reset key lets us clear the native file input after a successful upload.
  const [fileInputKey, setFileInputKey] = useState(0);
  const [lastResult, setLastResult] = useState<{
    inserted: number;
    duplicates: number;
    parsed: number;
    skipped: number;
  } | null>(null);

  const importSdData = useImportHiveScaleSdData(deviceId);

  const role = selectedDevice?.role;
  const canManage = role === 'owner' || role === 'admin';
  const disabled = !selectedDevice || !canManage;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (disabled) return;

    if (!file) {
      toast.error(t('sdData.errors.missingFile'));
      return;
    }

    importSdData.mutate(file, {
      onSuccess: result => {
        setFile(null);
        setFileInputKey(key => key + 1);
        setLastResult({
          inserted: result.inserted,
          duplicates: result.duplicates,
          parsed: result.parsed,
          skipped: result.skipped,
        });
        toast.success(
          t('sdData.importSuccess', {
            count: result.inserted,
            duplicates: result.duplicates,
          }),
        );
      },
      onError: error => toast.error(error.message),
    });
  };

  let notice: ReactNode = null;
  if (selectedDevice) {
    if (!canManage) {
      notice = (
        <p className="text-sm text-muted-foreground">
          {t('sdData.notice.noPermission', { role })}
        </p>
      );
    }
  } else {
    notice = (
      <p className="text-sm text-muted-foreground">
        {t('sdData.notice.selectDevice')}
      </p>
    );
  }

  return (
    <Card className={disabled ? 'opacity-60' : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {t('sdData.title')}
        </CardTitle>
        <CardDescription>{t('sdData.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {notice}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="sd-data-file">{t('sdData.file')}</Label>
            <Input
              key={fileInputKey}
              id="sd-data-file"
              type="file"
              accept=".ndjson,.tar,.json,application/x-tar,application/octet-stream"
              onChange={event => setFile(event.target.files?.[0] ?? null)}
              disabled={disabled || importSdData.isPending}
            />
            <p className="text-xs text-muted-foreground">
              {t('sdData.accepts')}
            </p>
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={disabled || importSdData.isPending}
          >
            <Upload className="mr-2 h-4 w-4" />
            {importSdData.isPending
              ? t('sdData.importing')
              : t('sdData.upload')}
          </Button>
        </form>

        {lastResult && (
          <div className="mt-4 rounded-md border p-3 text-xs text-muted-foreground">
            <p>
              {t('sdData.result.imported', {
                inserted: lastResult.inserted,
                duplicates: lastResult.duplicates,
              })}
            </p>
            <p>
              {t('sdData.result.parsed', { count: lastResult.parsed })}
              {lastResult.skipped > 0
                ? t('sdData.result.skipped', { count: lastResult.skipped })
                : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScaleSetupPanel({
  selectedDevice,
  selectedDeviceId,
  latest,
  hiveNameOptions,
  hiveMappings,
  onHiveMappingsChange,
  hasClaimedDevices,
  isDeviceListLoading,
  onCalibrationPollingChange,
  devices,
  onSelectDevice,
  onRemoveDevice,
  isRemovingDevice,
}: Readonly<{
  selectedDevice: HiveScaleDevice | undefined;
  selectedDeviceId: string | undefined;
  latest: HiveScaleMeasurement | undefined;
  hiveNameOptions: string[];
  hiveMappings: HiveMappingBySlot;
  onHiveMappingsChange: (mappings: HiveMappingBySlot) => void;
  hasClaimedDevices: boolean;
  isDeviceListLoading: boolean;
  onCalibrationPollingChange: (enabled: boolean) => void;
  devices: HiveScaleDevice[] | undefined;
  onSelectDevice: (deviceId: string) => void;
  onRemoveDevice: () => void;
  isRemovingDevice: boolean;
}>) {
  const { t } = useTranslation('hivescale');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isDeviceListLoading && !hasClaimedDevices) {
      setIsOpen(true);
    }
  }, [hasClaimedDevices, isDeviceListLoading]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>{t('setup.title')}</CardTitle>
              <CardDescription>{t('setup.description')}</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
              {isDeviceListLoading ? (
                <Skeleton className="h-10 w-full sm:w-64" />
              ) : devices?.length ? (
                <>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-64"
                    value={selectedDeviceId}
                    onChange={event => onSelectDevice(event.target.value)}
                  >
                    {devices.map(device => (
                      <option key={device.device_id} value={device.device_id}>
                        {device.display_name || device.device_id}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    onClick={onRemoveDevice}
                    disabled={!selectedDevice || isRemovingDevice}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('setup.removeScale')}
                  </Button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t('setup.noDevices')}
                </span>
              )}
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between sm:w-auto sm:min-w-40"
                >
                  {isOpen ? t('setup.hide') : t('setup.show')}
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ClaimDeviceCard />
              {selectedDevice && (
                <DeviceStatusCard
                  selectedDevice={selectedDevice}
                  latest={latest}
                />
              )}
              <ScaleMappingCard
                selectedDevice={selectedDevice}
                hiveNameOptions={hiveNameOptions}
                hiveMappings={hiveMappings}
                onHiveMappingsChange={onHiveMappingsChange}
              />
              <DeviceConfigCard
                selectedDevice={selectedDevice}
                deviceId={selectedDeviceId}
                latest={latest}
                onCalibrationPollingChange={onCalibrationPollingChange}
              />
              <TempCompensationCard
                selectedDevice={selectedDevice}
                deviceId={selectedDeviceId}
              />
              <SdDataUploadCard
                selectedDevice={selectedDevice}
                deviceId={selectedDeviceId}
              />
              <FirmwareUploadCard
                selectedDevice={selectedDevice}
                deviceId={selectedDeviceId}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function HiveScalePage() {
  const { t } = useTranslation('hivescale');
  const queryClient = useQueryClient();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>();
  const [dateRange, setDateRange] = useState<HiveScaleDateRange>(
    () => readStoredDateRange() ?? createPresetDateRange('24h'),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCalibrationPolling, setIsCalibrationPolling] = useState(false);
  const [hiveMappings, setHiveMappings] = useState<HiveMappingBySlot>(() =>
    emptyHiveMappings(),
  );
  const devices = useHiveScaleDevices();
  const measurementQuery = useMemo(() => {
    // For non-custom presets recompute startAt live on every render so a stale
    // timestamp stored from a previous session never gets sent to the API.
    let effectiveStartAt: string | undefined;
    if (dateRange.preset === 'all') {
      effectiveStartAt = undefined;
    } else if (dateRange.preset === 'custom') {
      effectiveStartAt = dateRange.startAt;
    } else {
      effectiveStartAt = createPresetDateRange(dateRange.preset).startAt;
    }

    return {
      limit: measurementLimitForRange(dateRange),
      start_at: effectiveStartAt,
      end_at: dateRange.preset === 'custom' ? dateRange.endAt : undefined,
    };
  }, [dateRange]);
  const measurements = useHiveScaleMeasurements(
    selectedDeviceId,
    measurementQuery,
    { refetchInterval: isCalibrationPolling ? 5000 : 60000 },
  );
  const insights = useHiveScaleInsights(selectedDeviceId, { lookbackDays: 14 });

  // Highest active severity, count, and full alert list per scale channel.
  // Drives the per-hive Insight rows (summary pill + expandable detail) on the
  // LatestValuePanel cards.
  const channelSeverity = useMemo(() => {
    const severityRank: Record<HiveScaleInsightSeverity, number> = {
      critical: 4,
      warning: 3,
      watch: 2,
      info: 1,
    };
    const out: Record<
      1 | 2,
      {
        severity: HiveScaleInsightSeverity | null;
        count: number;
        alerts: HiveScaleInsightAlert[];
      }
    > = {
      1: { severity: null, count: 0, alerts: [] },
      2: { severity: null, count: 0, alerts: [] },
    };
    for (const alert of insights.data?.alerts ?? []) {
      const slot = out[alert.channel as 1 | 2];
      if (!slot) continue;
      slot.count += 1;
      slot.alerts.push(alert);
      if (
        !slot.severity ||
        severityRank[alert.severity] > severityRank[slot.severity]
      ) {
        slot.severity = alert.severity;
      }
    }
    // Sort each channel's alerts by severity (highest first).
    for (const channel of [1, 2] as const) {
      out[channel].alerts.sort(
        (a, b) => severityRank[b.severity] - severityRank[a.severity],
      );
    }
    return out;
  }, [insights.data?.alerts]);
  const removeDevice = useRemoveHiveScaleDevice();
  const hives = useHivesWithBoxes(undefined, { enabled: true });
  const hiveNameOptions = useMemo(
    () =>
      [
        ...new Set((hives.data ?? []).map(hive => hive.name).filter(Boolean)),
      ].sort((a, b) => a.localeCompare(b)),
    [hives.data],
  );

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

  useEffect(() => {
    setHiveMappings(deviceHiveMappings(selectedDevice));
  }, [selectedDevice]);

  const latest = latestMeasurement(measurements.data);
  // The MAX17048 fuel gauge reports state-of-charge above 100% while the cell
  // is actively taking charge, so we treat >100% as the "charging" signal.
  // We also treat a sustained rise in battery voltage (>= 30 minutes) as
  // charging, since the SoC can plateau at/below 100% while the pack is still
  // being topped up.
  const isBatteryCharging =
    (latest?.battery_soc_percent ?? 0) > 100 ||
    isBatteryVoltageRising(measurements.data);

  useEffect(() => {
    if (latest?.calibration_mode === false && isCalibrationPolling) {
      setIsCalibrationPolling(false);
    }
  }, [isCalibrationPolling, latest?.calibration_mode]);

  const scale1Name = channelName(selectedDevice, 1, t('common.scale1'));
  const scale2Name = channelName(selectedDevice, 2, t('common.scale2'));

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

  const removeSelectedDevice = () => {
    if (!selectedDevice) return;
    const confirmed = globalThis.confirm(
      t('page.removeConfirm', {
        name: selectedDevice.display_name || selectedDevice.device_id,
      }),
    );
    if (!confirmed) return;

    removeDevice.mutate(selectedDevice.device_id, {
      onSuccess: () => {
        setSelectedDeviceId(undefined);
        toast.success(t('page.removeSuccess'));
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
        <div className="flex items-center gap-2">
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

      <ScaleSetupPanel
        selectedDevice={selectedDevice}
        selectedDeviceId={selectedDeviceId}
        latest={latest}
        hiveNameOptions={hiveNameOptions}
        hiveMappings={hiveMappings}
        onHiveMappingsChange={setHiveMappings}
        hasClaimedDevices={Boolean(devices.data?.length)}
        isDeviceListLoading={devices.isLoading}
        onCalibrationPollingChange={setIsCalibrationPolling}
        devices={devices.data}
        onSelectDevice={setSelectedDeviceId}
        onRemoveDevice={removeSelectedDevice}
        isRemovingDevice={removeDevice.isPending}
      />

      {selectedDevice && (
        <div className="grid gap-4 md:grid-cols-3">
          <LatestValuePanel
            title={scale1Name}
            description={t('common.scale1')}
            icon={Weight}
            badge={
              <HiveScaleSeverityPill
                severity={channelSeverity[1].severity}
                count={channelSeverity[1].count}
              />
            }
            rows={[
              {
                label: t('panel.weight'),
                value: `${numberOrDash(latest?.scale_1_weight_kg_compensated ?? latest?.scale_1_weight_kg)} kg`,
              },
              {
                label: t('panel.hiveTemp'),
                value: `${numberOrDash(latest?.hive_1_temp_c)} °C`,
              },
              {
                label: t('panel.humidity'),
                value: `${numberOrDash(latest?.ble_1_humidity_percent, 0)}%`,
              },
            ]}
            insight={{
              severity: channelSeverity[1].severity,
              count: channelSeverity[1].count,
              alerts: channelSeverity[1].alerts,
              scale1Name,
              scale2Name,
              isLoading: insights.isLoading,
              isError: insights.isError,
            }}
            historyAction={
              <HiveScaleInsightsHistoryDialog
                deviceId={selectedDevice.device_id}
                scale1Name={scale1Name}
                scale2Name={scale2Name}
                channel={1}
                compact
              />
            }
          />
          <LatestValuePanel
            title={scale2Name}
            description={t('common.scale2')}
            icon={Weight}
            badge={
              <HiveScaleSeverityPill
                severity={channelSeverity[2].severity}
                count={channelSeverity[2].count}
              />
            }
            rows={[
              {
                label: t('panel.weight'),
                value: `${numberOrDash(latest?.scale_2_weight_kg_compensated ?? latest?.scale_2_weight_kg)} kg`,
              },
              {
                label: t('panel.hiveTemp'),
                value: `${numberOrDash(latest?.hive_2_temp_c)} °C`,
              },
              {
                label: t('panel.humidity'),
                value: `${numberOrDash(latest?.ble_2_humidity_percent, 0)}%`,
              },
            ]}
            insight={{
              severity: channelSeverity[2].severity,
              count: channelSeverity[2].count,
              alerts: channelSeverity[2].alerts,
              scale1Name,
              scale2Name,
              isLoading: insights.isLoading,
              isError: insights.isError,
            }}
            historyAction={
              <HiveScaleInsightsHistoryDialog
                deviceId={selectedDevice.device_id}
                scale1Name={scale1Name}
                scale2Name={scale2Name}
                channel={2}
                compact
              />
            }
          />
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
                    channel1Name={scale1Name}
                    channel2Name={scale2Name}
                  />
                ),
              },
            ]}
          />
        </div>
      )}

      {selectedDevice && (
        <HiveScaleModularDashboard
          selectedDevice={selectedDevice}
          measurements={measurements.data}
          measurementsLoading={measurements.isLoading}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          scale1Name={scale1Name}
          scale2Name={scale2Name}
          hiveMappings={hiveMappings}
          alerts={insights.data?.alerts ?? []}
          insightsLoading={insights.isLoading}
          insightsError={insights.isError}
        />
      )}
    </div>
  );
}
