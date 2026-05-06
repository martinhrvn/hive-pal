import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  Clock,
  Droplets,
  Info,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
  Weight,
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

function DeviceConfigCard({
  deviceId,
  latest,
  onRefreshMeasurements,
}: {
  deviceId: string | undefined;
  latest: HiveScaleMeasurement | undefined;
  onRefreshMeasurements: () => void;
}) {
  const { data: config, isLoading } = useHiveScaleDeviceConfig(deviceId);
  const updateConfig = useUpdateHiveScaleConfig(deviceId);
  const [sendInterval, setSendInterval] = useState('');
  const [scale1Offset, setScale1Offset] = useState('');
  const [scale1Factor, setScale1Factor] = useState('');
  const [scale2Offset, setScale2Offset] = useState('');
  const [scale2Factor, setScale2Factor] = useState('');
  const [wizardScale, setWizardScale] = useState<1 | 2>(1);
  const [wizardStep, setWizardStep] = useState<
    'idle' | 'capture_empty' | 'place_weight' | 'waiting_loaded' | 'ready'
  >('idle');
  const [wizardOffsetRaw, setWizardOffsetRaw] = useState<number | null>(null);
  const [wizardOffsetMeasuredAt, setWizardOffsetMeasuredAt] = useState<string | null>(null);
  const [wizardLoadedRaw, setWizardLoadedRaw] = useState<number | null>(null);
  const [wizardKnownWeight, setWizardKnownWeight] = useState('');
  const [wizardFactor, setWizardFactor] = useState<number | null>(null);

  useEffect(() => {
    if (!config) return;
    setSendInterval(String(config.send_interval_seconds));
    setScale1Offset(String(config.scale1_offset));
    setScale1Factor(String(config.scale1_factor));
    setScale2Offset(String(config.scale2_offset));
    setScale2Factor(String(config.scale2_factor));
  }, [config]);

  const latestScale1Raw = latest?.scale_1_raw;
  const latestScale2Raw = latest?.scale_2_raw;
  const latestRawForWizard = wizardScale === 1 ? latestScale1Raw : latestScale2Raw;
  const hasLatestRawForWizard =
    typeof latestRawForWizard === 'number' && Number.isFinite(latestRawForWizard);
  const latestMeasuredAt = latest?.measured_at ?? null;

  const resetWizard = () => {
    setWizardStep('idle');
    setWizardOffsetRaw(null);
    setWizardOffsetMeasuredAt(null);
    setWizardLoadedRaw(null);
    setWizardKnownWeight('');
    setWizardFactor(null);
  };

  const validateConfigValues = (override?: Partial<{
    send_interval_seconds: number;
    scale1_offset: number;
    scale1_factor: number;
    scale2_offset: number;
    scale2_factor: number;
  }>) => {
    const parsedSendInterval = override?.send_interval_seconds ?? Number(sendInterval);
    if (
      !Number.isFinite(parsedSendInterval) ||
      !Number.isInteger(parsedSendInterval) ||
      parsedSendInterval < 30
    ) {
      toast.error('Use a whole-number interval of at least 30 seconds.');
      return null;
    }

    const parsedScale1Offset = override?.scale1_offset ?? Number(scale1Offset);
    const parsedScale2Offset = override?.scale2_offset ?? Number(scale2Offset);
    if (
      !Number.isFinite(parsedScale1Offset) ||
      !Number.isInteger(parsedScale1Offset) ||
      !Number.isFinite(parsedScale2Offset) ||
      !Number.isInteger(parsedScale2Offset)
    ) {
      toast.error('Scale offsets must be whole raw-count numbers.');
      return null;
    }

    const parsedScale1Factor = override?.scale1_factor ?? Number(scale1Factor);
    const parsedScale2Factor = override?.scale2_factor ?? Number(scale2Factor);
    if (
      !Number.isFinite(parsedScale1Factor) ||
      parsedScale1Factor === 0 ||
      !Number.isFinite(parsedScale2Factor) ||
      parsedScale2Factor === 0
    ) {
      toast.error('Scale factors must be non-zero numbers.');
      return null;
    }

    return {
      send_interval_seconds: parsedSendInterval,
      scale1_offset: parsedScale1Offset,
      scale1_factor: parsedScale1Factor,
      scale2_offset: parsedScale2Offset,
      scale2_factor: parsedScale2Factor,
    };
  };

  const saveConfig = () => {
    if (!deviceId) return;

    const parsedConfig = validateConfigValues();
    if (!parsedConfig) return;

    updateConfig.mutate(parsedConfig, {
      onSuccess: () => toast.success('HiveScale config updated.'),
      onError: error => toast.error(error.message),
    });
  };

  const startWizard = () => {
    if (!deviceId) return;
    resetWizard();
    updateConfig.mutate(
      { send_interval_seconds: 30 },
      {
        onSuccess: () => {
          setSendInterval('30');
          setWizardStep('capture_empty');
          toast.success('Calibration started. Device interval set to 30 seconds.');
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const captureEmptyRaw = () => {
    if (!hasLatestRawForWizard || !latestMeasuredAt) {
      toast.error(`No latest raw reading available for Scale ${wizardScale} yet.`);
      return;
    }
    const raw = Math.round(latestRawForWizard);
    setWizardOffsetRaw(raw);
    setWizardOffsetMeasuredAt(latestMeasuredAt);
    setWizardLoadedRaw(null);
    setWizardFactor(null);
    if (wizardScale === 1) setScale1Offset(String(raw));
    else setScale2Offset(String(raw));
    setWizardStep('place_weight');
    toast.success(`Scale ${wizardScale} empty raw captured as offset.`);
  };

  const waitForLoadedRaw = () => {
    const knownWeight = Number(wizardKnownWeight);
    if (!Number.isFinite(knownWeight) || knownWeight <= 0) {
      toast.error('Enter a known weight greater than 0 kg.');
      return;
    }
    if (wizardOffsetRaw === null || !wizardOffsetMeasuredAt) {
      toast.error('Capture the empty raw offset first.');
      return;
    }
    setWizardStep('waiting_loaded');
    onRefreshMeasurements();
    toast.message('Waiting for a newer raw reading with the known weight on the scale.');
  };

  useEffect(() => {
    if (wizardStep !== 'waiting_loaded') return;
    if (
      !wizardOffsetMeasuredAt ||
      !latestMeasuredAt ||
      new Date(latestMeasuredAt).getTime() <= new Date(wizardOffsetMeasuredAt).getTime()
    ) {
      return;
    }
    if (!hasLatestRawForWizard || wizardOffsetRaw === null) return;

    const knownWeight = Number(wizardKnownWeight);
    if (!Number.isFinite(knownWeight) || knownWeight <= 0) return;

    const loadedRaw = Math.round(latestRawForWizard);
    const factor = (loadedRaw - wizardOffsetRaw) / knownWeight;
    if (!Number.isFinite(factor) || factor === 0) {
      toast.error('Could not calculate a non-zero factor from this reading.');
      setWizardStep('place_weight');
      return;
    }

    setWizardLoadedRaw(loadedRaw);
    setWizardFactor(factor);
    if (wizardScale === 1) setScale1Factor(String(factor));
    else setScale2Factor(String(factor));
    setWizardStep('ready');
    toast.success(`Scale ${wizardScale} factor calculated.`);
  }, [
    hasLatestRawForWizard,
    latestMeasuredAt,
    latestRawForWizard,
    wizardKnownWeight,
    wizardOffsetMeasuredAt,
    wizardOffsetRaw,
    wizardScale,
    wizardStep,
  ]);

  const saveWizardCalibration = () => {
    if (!deviceId || wizardOffsetRaw === null || wizardFactor === null) return;

    const overrides = wizardScale === 1
      ? { send_interval_seconds: 600, scale1_offset: wizardOffsetRaw, scale1_factor: wizardFactor }
      : { send_interval_seconds: 600, scale2_offset: wizardOffsetRaw, scale2_factor: wizardFactor };
    const parsedConfig = validateConfigValues(overrides);
    if (!parsedConfig) return;

    updateConfig.mutate(parsedConfig, {
      onSuccess: () => {
        setSendInterval('600');
        resetWizard();
        toast.success('Calibration saved. Device interval reset to 600 seconds.');
      },
      onError: error => toast.error(error.message),
    });
  };

  if (!deviceId) return null;

  const latestScale1RawFormatted = numberOrDash(latestScale1Raw, 0);
  const latestScale2RawFormatted = numberOrDash(latestScale2Raw, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Calibration wizard</CardTitle>
            <CardDescription>
              Guided raw-offset and known-weight calibration for each scale.
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
              <p className="font-medium">Wizard workflow</p>
              <ol className="list-decimal space-y-1 pl-4">
                <li>Start calibration. The device interval is set to 30 seconds.</li>
                <li>Leave the scale empty and capture the latest raw value as offset.</li>
                <li>Place a known weight, enter its kg value, and wait for a newer raw reading.</li>
                <li>The frontend calculates factor = (loaded raw - offset) / known weight.</li>
                <li>Save calibration. The interval is reset to 600 seconds.</li>
              </ol>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : config ? (
          <>
            <div className="grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Current interval</p>
                <p className="font-medium">{sendInterval || '—'} seconds</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Scale 1 latest raw</p>
                <p className="font-medium">{latestScale1RawFormatted}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Scale 2 latest raw</p>
                <p className="font-medium">{latestScale2RawFormatted}</p>
              </div>
            </div>

            <div className="space-y-4 rounded-md border p-4">
              <div className="grid gap-3 md:grid-cols-[160px_1fr] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor="wizard-scale">Scale</Label>
                  <Select
                    value={String(wizardScale)}
                    onValueChange={value => {
                      setWizardScale(value === '2' ? 2 : 1);
                      resetWizard();
                    }}
                    disabled={wizardStep !== 'idle'}
                  >
                    <SelectTrigger id="wizard-scale">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Scale 1</SelectItem>
                      <SelectItem value="2">Scale 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  Latest measurement: {formatDateTime(latestMeasuredAt)}. Keep the scale empty until the offset step is captured.
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-4">
                <div className="rounded-md border p-3">
                  <p className="font-medium">1. Start</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Temporarily switches upload interval to 30 seconds.
                  </p>
                  <Button
                    type="button"
                    className="mt-3 w-full"
                    onClick={startWizard}
                    disabled={updateConfig.isPending || wizardStep !== 'idle'}
                  >
                    Start calibration
                  </Button>
                </div>

                <div className="rounded-md border p-3">
                  <p className="font-medium">2. Empty scale</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Capture latest raw as offset: {wizardOffsetRaw ?? 'not captured'}.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={captureEmptyRaw}
                    disabled={wizardStep !== 'capture_empty' || !hasLatestRawForWizard}
                  >
                    Capture empty raw
                  </Button>
                </div>

                <div className="rounded-md border p-3">
                  <p className="font-medium">3. Known weight</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Put the weight on the scale and enter kg.
                  </p>
                  <div className="mt-3 space-y-2">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 10"
                      value={wizardKnownWeight}
                      onChange={event => setWizardKnownWeight(event.target.value)}
                      disabled={wizardStep !== 'place_weight' && wizardStep !== 'waiting_loaded'}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={waitForLoadedRaw}
                      disabled={wizardStep !== 'place_weight'}
                    >
                      {wizardStep === 'waiting_loaded' ? 'Waiting…' : 'Wait for new raw'}
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border p-3">
                  <p className="font-medium">4. Save</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Loaded raw: {wizardLoadedRaw ?? '—'} · Factor:{' '}
                    {wizardFactor === null ? '—' : wizardFactor.toFixed(4)}
                  </p>
                  <Button
                    type="button"
                    className="mt-3 w-full"
                    onClick={saveWizardCalibration}
                    disabled={wizardStep !== 'ready' || updateConfig.isPending}
                  >
                    Save & reset to 600s
                  </Button>
                </div>
              </div>

              {wizardStep !== 'idle' && (
                <Button type="button" variant="ghost" size="sm" onClick={resetWizard}>
                  Cancel wizard
                </Button>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="font-medium">Manual config</p>
              <div className="grid gap-3 md:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="send-interval">Interval seconds</Label>
                  <Input
                    id="send-interval"
                    type="number"
                    min={30}
                    step={1}
                    value={sendInterval}
                    onChange={event => setSendInterval(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scale-1-offset">Scale 1 offset</Label>
                  <Input
                    id="scale-1-offset"
                    type="number"
                    step={1}
                    value={scale1Offset}
                    onChange={event => setScale1Offset(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scale-1-factor">Scale 1 factor</Label>
                  <Input
                    id="scale-1-factor"
                    type="number"
                    step="any"
                    value={scale1Factor}
                    onChange={event => setScale1Factor(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scale-2-offset">Scale 2 offset</Label>
                  <Input
                    id="scale-2-offset"
                    type="number"
                    step={1}
                    value={scale2Offset}
                    onChange={event => setScale2Offset(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scale-2-factor">Scale 2 factor</Label>
                  <Input
                    id="scale-2-factor"
                    type="number"
                    step="any"
                    value={scale2Factor}
                    onChange={event => setScale2Factor(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={saveConfig}
              disabled={updateConfig.isPending}
            >
              {updateConfig.isPending ? 'Saving…' : 'Save manual config'}
            </Button>
            <div className="text-xs text-muted-foreground">
              Config version {config.config_version}. A negative factor is valid if the raw value decreases when weight is added.
            </div>
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
  onRefreshMeasurements,
}: {
  selectedDevice: HiveScaleDevice | undefined;
  selectedDeviceId: string | undefined;
  latest: HiveScaleMeasurement | undefined;
  hiveNameOptions: string[];
  hasClaimedDevices: boolean;
  isDeviceListLoading: boolean;
  onRefreshMeasurements: () => void;
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
                deviceId={selectedDeviceId}
                latest={latest}
                onRefreshMeasurements={onRefreshMeasurements}
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>();
  const [dateRange, setDateRange] = useState<HiveScaleDateRange>(() =>
    createPresetDateRange('24h'),
  );
  const devices = useHiveScaleDevices();
  const measurementQuery = useMemo(
    () => ({
      limit: measurementLimitForRange(dateRange),
      start_at: dateRange.startAt,
      end_at: dateRange.endAt,
    }),
    [dateRange],
  );
  const measurements = useHiveScaleMeasurements(
    selectedDeviceId,
    measurementQuery,
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
  const scale1Name = channelName(selectedDevice, 1, 'Scale 1');
  const scale2Name = channelName(selectedDevice, 2, 'Scale 2');

  const refreshHiveScale = async () => {
    setIsRefreshing(true);
    try {
      if (dateRange.preset !== 'custom') {
        setDateRange(createPresetDateRange(dateRange.preset));
      }
      await Promise.all([
        devices.refetch(),
        measurements.refetch(),
        hives.refetch(),
        inspections.refetch(),
        queryClient.invalidateQueries({ queryKey: ['hivescale'] }),
      ]);
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
          variant="outline"
          onClick={refreshHiveScale}
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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
        onRefreshMeasurements={() => measurements.refetch()}
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
