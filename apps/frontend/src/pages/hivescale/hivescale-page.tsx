import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Clock,
  RefreshCw,
  Thermometer,
  Weight,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import {
  useClaimHiveScaleDevice,
  useHiveScaleDeviceConfig,
  useHiveScaleDevices,
  useHiveScaleMeasurements,
  useUpdateHiveScaleConfig,
  type HiveScaleMeasurement,
} from '@/api/hooks/useHiveScale';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const numberOrDash = (value: number | null | undefined, digits = 1) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '—';

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatChartTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const isOnline = (lastSeenAt: string | null | undefined) => {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 30 * 60 * 1000;
};

const latestMeasurement = (measurements: HiveScaleMeasurement[] | undefined) => {
  if (!measurements?.length) return undefined;
  return [...measurements].sort(
    (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
  )[0];
};

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="rounded-full bg-muted p-3">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ClaimDeviceCard() {
  const [claimCode, setClaimCode] = useState('');
  const [displayName, setDisplayName] = useState('');
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
      },
      {
        onSuccess: () => {
          setClaimCode('');
          setDisplayName('');
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
          Claim codes are sent by the firmware with measurements until the device is claimed.
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
          <Button type="submit" className="w-full" disabled={claimDevice.isPending}>
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
        <CardDescription>Changes are read by the firmware during its next upload cycle.</CardDescription>
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
              Config version {config.config_version}. Scale factors are still managed by the
              HiveScale backend/API and can be surfaced here later.
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No config returned.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function HiveScalePage() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>();
  const devices = useHiveScaleDevices();
  const measurements = useHiveScaleMeasurements(selectedDeviceId, { limit: 200 });

  useEffect(() => {
    if (!selectedDeviceId && devices.data?.length) {
      setSelectedDeviceId(devices.data[0].device_id);
    }
  }, [devices.data, selectedDeviceId]);

  const selectedDevice = devices.data?.find(
    device => device.device_id === selectedDeviceId,
  );
  const latest = latestMeasurement(measurements.data);

  const chartData = useMemo(
    () =>
      [...(measurements.data ?? [])]
        .sort(
          (a, b) =>
            new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime(),
        )
        .map(item => ({
          time: formatChartTime(item.measured_at),
          measuredAt: item.measured_at,
          scale1: item.scale_1_weight_kg,
          scale2: item.scale_2_weight_kg,
          hiveTemp1: item.hive_1_temp_c,
          hiveTemp2: item.hive_2_temp_c,
          ambientTemp: item.ambient_temp_c,
          humidity: item.ambient_humidity_percent,
        })),
    [measurements.data],
  );

  return (
    <PageGrid>
      <MainContent>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">HiveScale</h1>
              <p className="text-muted-foreground">
                Live weight and temperature visualisation from your separate HiveScale backend.
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
              <CardDescription>Select a claimed HiveScale device.</CardDescription>
            </CardHeader>
            <CardContent>
              {devices.isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : devices.data?.length ? (
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={selectedDeviceId}
                  onChange={event => setSelectedDeviceId(event.target.value)}
                >
                  {devices.data.map(device => (
                    <option key={device.device_id} value={device.device_id}>
                      {device.display_name || device.device_id}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No HiveScale devices are claimed for your user yet. Use the claim form on the right.
                </div>
              )}
            </CardContent>
          </Card>

          {selectedDevice && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Scale 1"
                value={`${numberOrDash(latest?.scale_1_weight_kg)} kg`}
                detail="Latest hive weight"
                icon={Weight}
              />
              <MetricCard
                title="Scale 2"
                value={`${numberOrDash(latest?.scale_2_weight_kg)} kg`}
                detail="Latest hive weight"
                icon={Weight}
              />
              <MetricCard
                title="Hive temp"
                value={`${numberOrDash(latest?.hive_1_temp_c)} °C`}
                detail={`Ambient ${numberOrDash(latest?.ambient_temp_c)} °C`}
                icon={Thermometer}
              />
              <MetricCard
                title="Signal"
                value={`${numberOrDash(latest?.rssi_dbm, 0)} dBm`}
                detail={isOnline(selectedDevice.last_seen_at) ? 'Online recently' : 'Offline or stale'}
                icon={Wifi}
              />
            </div>
          )}

          {selectedDevice && (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>{selectedDevice.display_name || selectedDevice.device_id}</CardTitle>
                    <CardDescription>
                      Last seen {formatDateTime(selectedDevice.last_seen_at)} · Firmware{' '}
                      {selectedDevice.last_firmware_version || 'unknown'}
                    </CardDescription>
                  </div>
                  <Badge variant={isOnline(selectedDevice.last_seen_at) ? 'default' : 'secondary'}>
                    {isOnline(selectedDevice.last_seen_at) ? 'Online' : 'Stale'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {measurements.isLoading ? (
                  <Skeleton className="h-80 w-full" />
                ) : chartData.length ? (
                  <Tabs defaultValue="weight">
                    <TabsList>
                      <TabsTrigger value="weight">Weight</TabsTrigger>
                      <TabsTrigger value="temperature">Temperature</TabsTrigger>
                      <TabsTrigger value="table">Latest rows</TabsTrigger>
                    </TabsList>
                    <TabsContent value="weight" className="pt-6">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" minTickGap={24} />
                            <YAxis unit=" kg" />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="scale1"
                              name="Scale 1"
                              stroke="var(--primary)"
                              connectNulls
                            />
                            <Line
                              type="monotone"
                              dataKey="scale2"
                              name="Scale 2"
                              stroke="var(--muted-foreground)"
                              connectNulls
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                    <TabsContent value="temperature" className="pt-6">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" minTickGap={24} />
                            <YAxis unit=" °C" />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="hiveTemp1"
                              name="Hive 1"
                              stroke="var(--primary)"
                              connectNulls
                            />
                            <Line
                              type="monotone"
                              dataKey="hiveTemp2"
                              name="Hive 2"
                              stroke="var(--muted-foreground)"
                              connectNulls
                            />
                            <Line
                              type="monotone"
                              dataKey="ambientTemp"
                              name="Ambient"
                              stroke="var(--border)"
                              connectNulls
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                    <TabsContent value="table" className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Measured</TableHead>
                            <TableHead>Scale 1</TableHead>
                            <TableHead>Scale 2</TableHead>
                            <TableHead>Hive temp</TableHead>
                            <TableHead>Humidity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...(measurements.data ?? [])].slice(0, 10).map(row => (
                            <TableRow key={row.id}>
                              <TableCell>{formatDateTime(row.measured_at)}</TableCell>
                              <TableCell>{numberOrDash(row.scale_1_weight_kg)} kg</TableCell>
                              <TableCell>{numberOrDash(row.scale_2_weight_kg)} kg</TableCell>
                              <TableCell>{numberOrDash(row.hive_1_temp_c)} °C</TableCell>
                              <TableCell>{numberOrDash(row.ambient_humidity_percent, 0)}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                    <Activity className="h-8 w-8" />
                    <p>No measurements returned for this device yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </MainContent>
      <PageAside>
        <div className="space-y-6">
          <ClaimDeviceCard />
          {selectedDevice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Device status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Device ID</span>
                  <span className="text-right font-mono">{selectedDevice.device_id}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Role</span>
                  <span>{selectedDevice.role}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Last measurement</span>
                  <span className="text-right">{formatDateTime(latest?.measured_at)}</span>
                </div>
              </CardContent>
            </Card>
          )}
          <DeviceConfigCard deviceId={selectedDeviceId} />
        </div>
      </PageAside>
    </PageGrid>
  );
}
