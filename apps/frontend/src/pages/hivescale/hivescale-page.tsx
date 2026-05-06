import { useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Droplets,
  Info,
  Play,
  Plus,
  RefreshCw,
  Square,
  Trash2,
  UserPlus,
  Weight,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useHivesWithBoxes } from '@/api/hooks/useHives';
import { useInspections } from '@/api/hooks/useInspections';
import {
  useClaimHiveScaleDevice,
  useHiveScaleDeviceConfig,
  useHiveScaleDevices,
  useHiveScaleMeasurements,
  useHiveScaleMembers,
  useRemoveHiveScaleDevice,
  useRevokeHiveScaleMember,
  useShareHiveScaleDevice,
  useStartHiveScaleCalibrationMode,
  useStopHiveScaleCalibrationMode,
  useUpdateHiveScaleChannels,
  useUpdateHiveScaleConfig,
  type HiveScaleDevice,
  type HiveScaleMeasurement,
} from '@/api/hooks/useHiveScale';
import {
  createPresetDateRange,
  HiveScaleDiagramPanel,
  measurementLimitForRange,
  type HiveScaleDateRange,
} from './hivescale-diagram-panel';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const numberOrDash = (value: number | null | undefined, digits = 1) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : '—';

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return 'Never';
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

const channelName = (
  device: HiveScaleDevice | undefined,
  channelNumber: 1 | 2,
  fallback: string,
) =>
  device?.channels?.find(channel => channel.channel_number === channelNumber)
    ?.name || fallback;

function HiveNameInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  hiveNameOptions,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hiveNameOptions: string[];
}) {
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
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  rows: { label: string; value: string }[];
}) {
  return (
    <Card>
      <CardContent className="flex gap-4 pt-6">
        <div className="rounded-full bg-muted p-3">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="space-y-2">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClaimDeviceCard({ hiveNameOptions }: { hiveNameOptions: string[] }) {
  const [claimCode, setClaimCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [scale1DisplayName, setScale1DisplayName] = useState('');
  const [scale2DisplayName, setScale2DisplayName] = useState('');
  const claimDevice = useClaimHiveScaleDevice();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const normalizedClaimCode = claimCode.trim();
    if (!normalizedClaimCode) {
      toast.error('Enter the claim code printed/configured for the device.');
      return;
    }

    claimDevice.mutate(
      {
        claim_code: normalizedClaimCode,
        display_name: displayName.trim() || undefined,
        scale_1_display_name: scale1DisplayName.trim() || undefined,
        scale_2_display_name: scale2DisplayName.trim() || undefined,
      },
      {
        onSuccess: () => {
          setClaimCode('');
          setDisplayName('');
          setScale1DisplayName('');
          setScale2DisplayName('');
          toast.success('HiveScale device claimed.');
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim HiveScale device</CardTitle>
        <CardDescription>
          Claim codes are sent by the firmware with measurements until the
          device is claimed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="claim-code">Claim code</Label>
            <Input
              id="claim-code"
              value={claimCode}
              onChange={event => setClaimCode(event.target.value)}
              placeholder="ABCD-1234"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={event => setDisplayName(event.target.value)}
              placeholder="Hive scale north"
            />
          </div>
          <HiveNameInput
            id="scale-1-display-name"
            label="Display name for Scale 1"
            value={scale1DisplayName}
            onChange={setScale1DisplayName}
            placeholder="Select or type a hive name"
            hiveNameOptions={hiveNameOptions}
          />
          <HiveNameInput
            id="scale-2-display-name"
            label="Display name for Scale 2"
            value={scale2DisplayName}
            onChange={setScale2DisplayName}
            placeholder="Select or type a hive name"
            hiveNameOptions={hiveNameOptions}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={claimDevice.isPending}
          >
            {claimDevice.isPending ? 'Claiming…' : 'Claim device'}
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

const formatRawCapture = (capture: CapturedRawReading | null) => {
  if (!capture) return 'Not captured yet';
  return `${capture.raw.toFixed(0)} raw · ${formatDateTime(capture.measuredAt)}`;
};

function DeviceConfigCard({
  selectedDevice,
  deviceId,
  latest,
  onCalibrationPollingChange,
}: {
  selectedDevice: HiveScaleDevice | undefined;
  deviceId: string | undefined;
  latest: HiveScaleMeasurement | undefined;
  onCalibrationPollingChange: (enabled: boolean) => void;
}) {
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
  const scale1Name = channelName(selectedDevice, 1, 'Scale 1');
  const scale2Name = channelName(selectedDevice, 2, 'Scale 2');
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
          toast.success(
            'Calibration mode queued. The scale will switch to fast readings when it wakes up.',
          );
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
          toast.success('Calibration mode stop queued.');
        }
      },
      onError: error => toast.error(error.message),
    });
  };

  const captureLatestRaw = (
    type: 'empty' | 'loaded',
  ): CapturedRawReading | null => {
    if (!isCalibrationModeActive) {
      toast.error(
        'Start calibration mode and wait until fast readings are active.',
      );
      return null;
    }

    if (!latest?.measured_at || !hasValidRaw(latestRaw)) {
      toast.error(
        `No latest raw reading available for ${activeScaleName} yet.`,
      );
      return null;
    }

    if (type === 'loaded') {
      if (!emptyCapture) {
        toast.error('Capture the empty scale first.');
        return null;
      }
      if (knownWeight === null) {
        toast.error('Enter the known weight in kg first.');
        return null;
      }
      if (
        new Date(latest.measured_at).getTime() <=
        new Date(emptyCapture.measuredAt).getTime()
      ) {
        toast.error(
          'Wait for a new fast reading after placing the known weight, then capture again.',
        );
        return null;
      }
    }

    return { raw: latestRaw, measuredAt: latest.measured_at };
  };

  const captureEmptyRaw = () => {
    const capture = captureLatestRaw('empty');
    if (!capture) return;
    setEmptyCapture(capture);
    setLoadedCapture(null);
    toast.success(`${activeScaleName} empty reading captured.`);
  };

  const captureLoadedRaw = () => {
    const capture = captureLatestRaw('loaded');
    if (!capture) return;
    setLoadedCapture(capture);
    toast.success(`${activeScaleName} weighted reading captured.`);
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
        toast.success(`${activeScaleName} calibration saved.`);
        stopFastMode(false);
        setIsWizardOpen(false);
      },
      onError: error => toast.error(error.message),
    });
  };

  const saveConfig = () => {
    if (!deviceId) return;

    const parsedSendInterval = Number(sendInterval);
    if (
      !Number.isFinite(parsedSendInterval) ||
      !Number.isInteger(parsedSendInterval) ||
      parsedSendInterval < 60
    ) {
      toast.error('Use a whole-number interval of at least 60 seconds.');
      return;
    }

    const parsedScale1Offset = Number(scale1Offset);
    const parsedScale2Offset = Number(scale2Offset);
    if (
      !Number.isFinite(parsedScale1Offset) ||
      !Number.isInteger(parsedScale1Offset) ||
      !Number.isFinite(parsedScale2Offset) ||
      !Number.isInteger(parsedScale2Offset)
    ) {
      toast.error('Scale offsets must be whole raw-count numbers.');
      return;
    }

    const parsedScale1Factor = Number(scale1Factor);
    const parsedScale2Factor = Number(scale2Factor);
    if (
      !Number.isFinite(parsedScale1Factor) ||
      parsedScale1Factor === 0 ||
      !Number.isFinite(parsedScale2Factor) ||
      parsedScale2Factor === 0
    ) {
      toast.error('Scale factors must be non-zero numbers.');
      return;
    }

    updateConfig.mutate(
      {
        send_interval_seconds: parsedSendInterval,
        scale1_offset: parsedScale1Offset,
        scale1_factor: parsedScale1Factor,
        scale2_offset: parsedScale2Offset,
        scale2_factor: parsedScale2Factor,
      },
      {
        onSuccess: () => toast.success('HiveScale config updated.'),
        onError: error => toast.error(error.message),
      },
    );
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
      toast.error(`No latest raw reading available for ${scaleName} yet.`);
      return;
    }
    setOffset(String(raw));
    toast.success(`${scaleName} offset set to latest raw reading.`);
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
    if (!hasValidRaw(raw)) {
      toast.error(`No latest raw reading available for ${scaleName} yet.`);
      return;
    }

    const parsedOffset = Number(offset);
    if (!Number.isFinite(parsedOffset)) {
      toast.error(`Enter a valid offset for ${scaleName} first.`);
      return;
    }

    const parsedKnownWeightKg = Number(knownWeightKg);
    if (!Number.isFinite(parsedKnownWeightKg) || parsedKnownWeightKg <= 0) {
      toast.error(`Enter a known weight greater than 0 kg for ${scaleName}.`);
      return;
    }

    const factor = (raw - parsedOffset) / parsedKnownWeightKg;
    if (!Number.isFinite(factor) || factor === 0) {
      toast.error(
        `${scaleName} factor could not be calculated. Check the latest raw, offset, and known weight.`,
      );
      return;
    }

    const formattedFactor = Number(factor.toPrecision(12)).toString();
    setFactor(formattedFactor);
    toast.success(`${scaleName} factor calculated: ${formattedFactor}`);
  };

  const pendingAction =
    updateConfig.isPending ||
    startCalibrationMode.isPending ||
    stopCalibrationMode.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Calibration</CardTitle>
            <CardDescription>
              Guided fast-mode calibration for the raw scale readings.
            </CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label="Show scale calibration instructions"
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              align="start"
              className="max-w-sm space-y-2 text-left"
            >
              <p className="font-medium">Simple workflow</p>
              <ol className="list-decimal space-y-1 pl-4">
                <li>Start calibration mode and wait for fast readings.</li>
                <li>Capture the empty scale reading.</li>
                <li>Place a known weight and enter its kg value.</li>
                <li>Capture the weighted reading and save.</li>
                <li>The app stops calibration mode after saving.</li>
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
                  <p className="font-medium">Fast calibration mode</p>
                  <p className="text-xs text-muted-foreground">
                    {isCalibrationModeActive
                      ? 'Active: new raw readings should arrive every few seconds.'
                      : calibrationQueued
                        ? 'Queued: waiting for the device to wake up once.'
                        : 'Off: the scale is using normal battery-saving sleep.'}
                  </p>
                </div>
                <Badge
                  variant={isCalibrationModeActive ? 'default' : 'secondary'}
                  className="shrink-0"
                >
                  {isCalibrationModeActive
                    ? 'Active'
                    : calibrationQueued
                      ? 'Queued'
                      : 'Off'}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">
                    {scale1Name}
                  </span>
                  <br />
                  Raw {numberOrDash(latestScale1Raw, 0)}
                </div>
                <div>
                  <span className="font-medium text-foreground">
                    {scale2Name}
                  </span>
                  <br />
                  Raw {numberOrDash(latestScale2Raw, 0)}
                </div>
              </div>
            </div>

            <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" disabled={!canConfigure}>
                  <Zap className="mr-2 h-4 w-4" />
                  Open calibration wizard
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Scale calibration wizard</DialogTitle>
                  <DialogDescription>
                    Follow the steps in order. The app uses only fresh raw
                    readings from calibration mode, then saves and stops fast
                    mode automatically.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertTitle>
                      {isCalibrationModeActive
                        ? 'Fast readings are active'
                        : calibrationQueued
                          ? 'Calibration mode is queued'
                          : 'Start calibration mode first'}
                    </AlertTitle>
                    <AlertDescription>
                      {isCalibrationModeActive
                        ? `Latest reading: ${formatDateTime(latest?.measured_at)}.`
                        : calibrationQueued
                          ? 'The device needs one normal wake-up before it can receive the command.'
                          : 'This disables the annoying deep-sleep delay for about 10 minutes.'}
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
                        ? 'Starting…'
                        : isCalibrationModeActive
                          ? 'Fast mode active'
                          : 'Start fast mode'}
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
                        ? 'Stopping…'
                        : 'Stop fast mode'}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Which scale are you calibrating?</Label>
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
                                Latest raw {numberOrDash(raw, 0)}
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
                          <p className="font-medium">Empty scale</p>
                          <p className="text-xs text-muted-foreground">
                            Remove weight from {activeScaleName}, then wait for
                            one fast reading.
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Captured: {formatRawCapture(emptyCapture)}
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
                        Capture empty raw
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
                          <p className="font-medium">Known weight</p>
                          <p className="text-xs text-muted-foreground">
                            Place the weight and enter its value in kg.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wizard-known-weight">Weight / kg</Label>
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
                        Captured: {formatRawCapture(loadedCapture)}
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
                        Capture weight raw
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
                          <p className="font-medium">Save result</p>
                          <p className="text-xs text-muted-foreground">
                            The factor is calculated automatically.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        <p className="text-xs text-muted-foreground">Offset</p>
                        <p className="font-mono">
                          {emptyCapture ? Math.round(emptyCapture.raw) : '—'}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Factor / raw per kg
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
                          ? 'Saving…'
                          : 'Save and stop fast mode'}
                      </Button>
                    </div>
                  </div>

                  {emptyCapture &&
                    loadedCapture &&
                    calculatedFactor === null && (
                      <Alert variant="destructive">
                        <Info className="h-4 w-4" />
                        <AlertTitle>No usable raw change detected</AlertTitle>
                        <AlertDescription>
                          Check that the known weight is on the correct scale
                          and wait for another fast reading.
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              </DialogContent>
            </Dialog>

            {!canConfigure && (
              <p className="text-xs text-muted-foreground">
                Viewer access can read measurements but cannot change
                calibration.
              </p>
            )}

            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between px-0"
                >
                  Advanced manual settings
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${
                      isAdvancedOpen ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-5 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="send-interval">Send interval seconds</Label>
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
                    <p className="font-medium">{scale1Name} manual values</p>
                    <p className="text-xs text-muted-foreground">
                      Latest raw: {numberOrDash(latestScale1Raw, 0)}. Weight is
                      calculated as (raw - offset) / factor.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scale-1-offset">
                      Offset / empty raw reading
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
                        Use latest
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scale-1-known-weight">
                      Known weight / kg
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
                        Calculate
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scale-1-factor">
                      Factor / raw counts per kg
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
                    <p className="font-medium">{scale2Name} manual values</p>
                    <p className="text-xs text-muted-foreground">
                      Latest raw: {numberOrDash(latestScale2Raw, 0)}. Weight is
                      calculated as (raw - offset) / factor.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scale-2-offset">
                      Offset / empty raw reading
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
                        Use latest
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scale-2-known-weight">
                      Known weight / kg
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
                        Calculate
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scale-2-factor">
                      Factor / raw counts per kg
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
                  {updateConfig.isPending ? 'Saving…' : 'Save manual config'}
                </Button>
                <div className="text-xs text-muted-foreground">
                  Config version {config.config_version}. Use advanced settings
                  only for fine tuning or recovery.
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No config returned.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ScaleMappingCard({
  selectedDevice,
  hiveNameOptions,
}: {
  selectedDevice: HiveScaleDevice | undefined;
  hiveNameOptions: string[];
}) {
  const updateChannels = useUpdateHiveScaleChannels(selectedDevice?.device_id);
  const [scale1DisplayName, setScale1DisplayName] = useState('');
  const [scale2DisplayName, setScale2DisplayName] = useState('');

  useEffect(() => {
    setScale1DisplayName(channelName(selectedDevice, 1, ''));
    setScale2DisplayName(channelName(selectedDevice, 2, ''));
  }, [selectedDevice]);

  if (!selectedDevice || selectedDevice.role === 'viewer') return null;

  const saveMapping = () => {
    updateChannels.mutate(
      {
        scale_1_display_name: scale1DisplayName.trim() || undefined,
        scale_2_display_name: scale2DisplayName.trim() || undefined,
      },
      {
        onSuccess: () => toast.success('Scale mapping updated.'),
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scale mapping</CardTitle>
        <CardDescription>
          These labels stay in HiveScale. Later, this is the right place to map
          Scale 1/2 to HivePal hive IDs for inspection markers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <HiveNameInput
          id="mapping-scale-1"
          label="Display name for Scale 1"
          value={scale1DisplayName}
          onChange={setScale1DisplayName}
          placeholder="Select or type a hive name"
          hiveNameOptions={hiveNameOptions}
        />
        <HiveNameInput
          id="mapping-scale-2"
          label="Display name for Scale 2"
          value={scale2DisplayName}
          onChange={setScale2DisplayName}
          placeholder="Select or type a hive name"
          hiveNameOptions={hiveNameOptions}
        />
        <Button
          className="w-full"
          onClick={saveMapping}
          disabled={updateChannels.isPending}
        >
          {updateChannels.isPending ? 'Saving…' : 'Save mapping'}
        </Button>
      </CardContent>
    </Card>
  );
}

function DeviceStatusCard({
  selectedDevice,
  latest,
}: {
  selectedDevice: HiveScaleDevice;
  latest: HiveScaleMeasurement | undefined;
}) {
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
      toast.error('Enter the email address of an existing HivePal user.');
      return;
    }

    shareDevice.mutate(
      { email: normalizedEmail, role },
      {
        onSuccess: () => {
          setEmail('');
          setRole('viewer');
          setShowShareForm(false);
          toast.success('HiveScale access shared.');
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
          Device status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Device ID</span>
            <span className="text-right font-mono">
              {selectedDevice.device_id}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Role</span>
            <span>{selectedDevice.role}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Last measurement</span>
            <span className="text-right">
              {formatDateTime(latest?.measured_at)}
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">Sharing</p>
              <p className="text-xs text-muted-foreground">
                Grant admin or viewer access.
              </p>
            </div>
            {canManageMembers && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowShareForm(value => !value)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Share with different user
              </Button>
            )}
          </div>

          {showShareForm && canManageMembers && (
            <form
              className="space-y-3 rounded-md border p-3"
              onSubmit={submitShare}
            >
              <div className="space-y-2">
                <Label htmlFor="share-email">Mail-address</Label>
                <Input
                  id="share-email"
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={value => setRole(value as 'admin' | 'viewer')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={shareDevice.isPending}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {shareDevice.isPending ? 'Sharing…' : 'Grant access'}
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
                          onSuccess: () => toast.success('Access revoked.'),
                          onError: error => toast.error(error.message),
                        })
                      }
                    >
                      Revoke access
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

function ScaleSetupPanel({
  selectedDevice,
  selectedDeviceId,
  latest,
  hiveNameOptions,
  hasClaimedDevices,
  isDeviceListLoading,
  onCalibrationPollingChange,
}: {
  selectedDevice: HiveScaleDevice | undefined;
  selectedDeviceId: string | undefined;
  latest: HiveScaleMeasurement | undefined;
  hiveNameOptions: string[];
  hasClaimedDevices: boolean;
  isDeviceListLoading: boolean;
  onCalibrationPollingChange: (enabled: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isDeviceListLoading && !hasClaimedDevices) {
      setIsOpen(true);
    }
  }, [hasClaimedDevices, isDeviceListLoading]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Scale setup</CardTitle>
              <CardDescription>
                Claim devices, check status, map scales, and calibrate the raw
                readings. Collapse this panel to give the diagram more space.
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between md:w-auto md:min-w-40"
              >
                {isOpen ? 'Hide setup' : 'Show setup'}
                <ChevronDown
                  className={`ml-2 h-4 w-4 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid gap-4 xl:grid-cols-4">
              <ClaimDeviceCard hiveNameOptions={hiveNameOptions} />
              {selectedDevice && (
                <DeviceStatusCard
                  selectedDevice={selectedDevice}
                  latest={latest}
                />
              )}
              <ScaleMappingCard
                selectedDevice={selectedDevice}
                hiveNameOptions={hiveNameOptions}
              />
              <DeviceConfigCard
                selectedDevice={selectedDevice}
                deviceId={selectedDeviceId}
                latest={latest}
                onCalibrationPollingChange={onCalibrationPollingChange}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function HiveScalePage() {
  const queryClient = useQueryClient();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>();
  const [dateRange, setDateRange] = useState<HiveScaleDateRange>(() =>
    createPresetDateRange('24h'),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCalibrationPolling, setIsCalibrationPolling] = useState(false);
  const devices = useHiveScaleDevices();
  const measurementQuery = useMemo(
    () => ({
      limit: measurementLimitForRange(dateRange),
      start_at: dateRange.startAt,
      end_at: dateRange.preset === 'custom' ? dateRange.endAt : undefined,
    }),
    [dateRange],
  );
  const measurements = useHiveScaleMeasurements(
    selectedDeviceId,
    measurementQuery,
    { refetchInterval: isCalibrationPolling ? 5000 : 60000 },
  );
  const removeDevice = useRemoveHiveScaleDevice();
  const hives = useHivesWithBoxes(undefined, { enabled: true });
  const inspections = useInspections({
    startDate: dateRange.startAt,
    endDate: dateRange.endAt,
  });

  const hiveNameOptions = useMemo(
    () =>
      [
        ...new Set((hives.data ?? []).map(hive => hive.name).filter(Boolean)),
      ].sort(),
    [hives.data],
  );

  useEffect(() => {
    if (!selectedDeviceId && devices.data?.length) {
      setSelectedDeviceId(devices.data[0].device_id);
    }
  }, [devices.data, selectedDeviceId]);

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
  const latest = latestMeasurement(measurements.data);

  useEffect(() => {
    if (latest?.calibration_mode === false && isCalibrationPolling) {
      setIsCalibrationPolling(false);
    }
  }, [isCalibrationPolling, latest?.calibration_mode]);

  const scale1Name = channelName(selectedDevice, 1, 'Scale 1');
  const scale2Name = channelName(selectedDevice, 2, 'Scale 2');

  const refreshHiveScaleData = async () => {
    setIsRefreshing(true);

    try {
      if (dateRange.preset !== 'custom') {
        setDateRange(createPresetDateRange(dateRange.preset));
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['hivescale'] }),
        queryClient.invalidateQueries({ queryKey: ['hives'] }),
        queryClient.invalidateQueries({ queryKey: ['inspections'] }),
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not refresh HiveScale data.',
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const removeSelectedDevice = () => {
    if (!selectedDevice) return;
    const confirmed = window.confirm(
      `Remove ${selectedDevice.display_name || selectedDevice.device_id} from your HivePal account? You can add it again with the claim code when no other users still have access.`,
    );
    if (!confirmed) return;

    removeDevice.mutate(selectedDevice.device_id, {
      onSuccess: () => {
        setSelectedDeviceId(undefined);
        toast.success('HiveScale device removed from your account.');
      },
      onError: error => toast.error(error.message),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HiveScale</h1>
          <p className="text-muted-foreground">
            Live weight and temperature visualisation from your separate
            HiveScale backend.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={refreshHiveScaleData}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
          <CardDescription>
            Select or remove a claimed HiveScale device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : devices.data?.length ? (
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <select
                className="h-10 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                value={selectedDeviceId}
                onChange={event => setSelectedDeviceId(event.target.value)}
              >
                {devices.data.map(device => (
                  <option key={device.device_id} value={device.device_id}>
                    {device.display_name || device.device_id}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={removeSelectedDevice}
                disabled={!selectedDevice || removeDevice.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove scale
              </Button>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No HiveScale devices are claimed for your user yet. Open the scale
              setup panel and use the claim form.
            </div>
          )}
        </CardContent>
      </Card>

      <ScaleSetupPanel
        selectedDevice={selectedDevice}
        selectedDeviceId={selectedDeviceId}
        latest={latest}
        hiveNameOptions={hiveNameOptions}
        hasClaimedDevices={Boolean(devices.data?.length)}
        isDeviceListLoading={devices.isLoading}
        onCalibrationPollingChange={setIsCalibrationPolling}
      />

      {selectedDevice && (
        <div className="grid gap-4 md:grid-cols-3">
          <LatestValuePanel
            title={scale1Name}
            description="Scale 1"
            icon={Weight}
            rows={[
              {
                label: 'Weight',
                value: `${numberOrDash(latest?.scale_1_weight_kg)} kg`,
              },
              {
                label: 'Hive temp',
                value: `${numberOrDash(latest?.hive_1_temp_c)} °C`,
              },
            ]}
          />
          <LatestValuePanel
            title={scale2Name}
            description="Scale 2"
            icon={Weight}
            rows={[
              {
                label: 'Weight',
                value: `${numberOrDash(latest?.scale_2_weight_kg)} kg`,
              },
              {
                label: 'Hive temp',
                value: `${numberOrDash(latest?.hive_2_temp_c)} °C`,
              },
            ]}
          />
          <LatestValuePanel
            title="Ambient"
            description="Outside sensor"
            icon={Droplets}
            rows={[
              {
                label: 'Temperature',
                value: `${numberOrDash(latest?.ambient_temp_c)} °C`,
              },
              {
                label: 'Humidity',
                value: `${numberOrDash(latest?.ambient_humidity_percent, 0)}%`,
              },
            ]}
          />
        </div>
      )}

      {selectedDevice && (
        <HiveScaleDiagramPanel
          selectedDevice={selectedDevice}
          measurements={measurements.data}
          isLoading={measurements.isLoading}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          scale1Name={scale1Name}
          scale2Name={scale2Name}
          inspections={inspections.data}
          hives={hives.data}
        />
      )}
    </div>
  );
}
