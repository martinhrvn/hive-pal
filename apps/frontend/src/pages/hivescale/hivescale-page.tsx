import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Clock,
  Droplets,
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
import {
  MainContent,
  PageAside,
  PageGrid,
} from '@/components/layout/page-grid-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

const isOnline = (lastSeenAt: string | null | undefined) => {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 30 * 60 * 1000;
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

function DeviceConfigCard({ deviceId }: { deviceId: string | undefined }) {
  const { data: config, isLoading } = useHiveScaleDeviceConfig(deviceId);
  const updateConfig = useUpdateHiveScaleConfig(deviceId);
  const [sendInterval, setSendInterval] = useState('');

  useEffect(() => {
    if (config) setSendInterval(String(config.send_interval_seconds));
  }, [config]);

  const saveInterval = () => {
    if (!deviceId) return;
    const parsed = Number(sendInterval);
    if (!Number.isFinite(parsed) || parsed < 60) {
      toast.error('Use an interval of at least 60 seconds.');
      return;
    }
    updateConfig.mutate(
      { send_interval_seconds: parsed },
      {
        onSuccess: () => toast.success('HiveScale config updated.'),
        onError: error => toast.error(error.message),
      },
    );
  };

  if (!deviceId) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device config</CardTitle>
        <CardDescription>
          Changes are read by the firmware during its next upload cycle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : config ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="send-interval">Send interval seconds</Label>
              <Input
                id="send-interval"
                type="number"
                min={60}
                value={sendInterval}
                onChange={event => setSendInterval(event.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={saveInterval}
              disabled={updateConfig.isPending}
            >
              {updateConfig.isPending ? 'Saving…' : 'Save interval'}
            </Button>
            <div className="text-xs text-muted-foreground">
              Config version {config.config_version}. Scale calibration factors
              are still managed by the HiveScale backend/API and can be surfaced
              here later.
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

export function HiveScalePage() {
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
    <PageGrid>
      <MainContent>
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
              onClick={() => {
                devices.refetch();
                measurements.refetch();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
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
                  No HiveScale devices are claimed for your user yet. Use the
                  claim form on the right.
                </div>
              )}
            </CardContent>
          </Card>

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
      </MainContent>
      <PageAside>
        <div className="space-y-6">
          <ClaimDeviceCard hiveNameOptions={hiveNameOptions} />
          {selectedDevice && (
            <DeviceStatusCard selectedDevice={selectedDevice} latest={latest} />
          )}
          <ScaleMappingCard
            selectedDevice={selectedDevice}
            hiveNameOptions={hiveNameOptions}
          />
          <DeviceConfigCard deviceId={selectedDeviceId} />
        </div>
      </PageAside>
    </PageGrid>
  );
}
