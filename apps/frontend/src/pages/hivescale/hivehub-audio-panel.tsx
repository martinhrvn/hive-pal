import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Mic,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  hiveScaleRecordingWavUrl,
  useDeleteHiveScaleRecording,
  useHiveScaleRecordings,
  useRequestHiveScaleRecording,
  type HiveScaleDevice,
  type HiveScaleMeasurement,
  type HiveScaleRecording,
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { hiveSlotName, type HiveMappingBySlot } from './hivehub-links';

// Same lengths as HiveHub's own panel. The node stops itself at 60 s, and a
// shorter session costs less battery and less time with the hive off the air
// (a connected node neither advertises nor samples).
const AUDIO_DURATIONS = [10, 30, 60] as const;
const DEFAULT_DURATION = 30;

// HiveHub clamps gain to −20..+20 dB server-side.
const AUDIO_GAINS = [-20, -12, -6, 0, 6, 12, 20] as const;

// Fast while a request is in flight so its state changes show up promptly;
// slow otherwise, because nothing moves until somebody asks for a recording.
const AUDIO_POLL_ACTIVE_MS = 3000;
const AUDIO_POLL_IDLE_MS = 60000;

// Mirrors HiveHub's clipping warning threshold.
const CLIPPING_WARN_PCT = 5;

const DASH = '—';

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const formatDateTime = (value: string | null) => {
  if (!value) return DASH;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? DASH : dateTimeFormat.format(date);
};

const integerFormat = new Intl.NumberFormat();

const isInFlight = (rec: HiveScaleRecording) =>
  rec.status === 'requested' || rec.status === 'streaming';

interface HiveInsideNode {
  slot: number;
  deviceName: string | null;
}

// Only a HiveInside has a microphone. Offering other hives would let somebody
// queue a request the hub can only reject a wake cycle later.
const hiveInsideNodes = (latest?: HiveScaleMeasurement): HiveInsideNode[] =>
  (latest?.hives ?? [])
    .filter(hive => {
      const ble = hive.ble;
      if (!ble) return false;
      return (
        /hiveinside/i.test(ble.sensor_type ?? '') ||
        /nrf54/i.test(ble.board ?? '')
      );
    })
    .map(hive => ({
      slot: hive.index,
      deviceName: hive.ble?.device_name ?? null,
    }))
    .sort((a, b) => a.slot - b.slot);

const formatGain = (gain: number) => (gain > 0 ? `+${gain}` : `${gain}`);

type Tone = 'good' | 'warn' | 'muted';

const toneClass: Record<Tone, string> = {
  good: 'text-emerald-700 dark:text-emerald-400',
  warn: 'text-amber-700 dark:text-amber-400',
  muted: 'text-muted-foreground',
};

const confirmationTone = (confirmation: string): Tone => {
  if (confirmation === 'verified' || confirmation === 'confirmed')
    return 'good';
  if (confirmation === 'reported') return 'warn';
  return 'muted';
};

const confirmationLabel = (t: TFunction, confirmation: string) => {
  switch (confirmation) {
    case 'verified':
      return t('audio.confirmation.verified');
    case 'reported':
      return t('audio.confirmation.reported');
    case 'confirmed':
      return t('audio.confirmation.confirmed');
    default:
      return t('audio.confirmation.unknown');
  }
};

function StatusBadge({ rec }: { rec: HiveScaleRecording }) {
  const { t } = useTranslation('hivescale');
  switch (rec.status) {
    case 'requested':
      return (
        <Badge variant="secondary">
          <Loader2 className="animate-spin" />
          {t('audio.status.requested')}
        </Badge>
      );
    case 'streaming':
      return (
        <Badge className="border-transparent bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
          <Loader2 className="animate-spin" />
          {t('audio.status.streaming')}
        </Badge>
      );
    case 'ready':
      return rec.complete ? (
        <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
          <CheckCircle2 />
          {t('audio.status.ready')}
        </Badge>
      ) : (
        <Badge className="border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
          <AlertTriangle />
          {t('audio.status.readyIncomplete')}
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive">
          <XCircle />
          {t('audio.status.failed')}
        </Badge>
      );
    default:
      return <Badge variant="outline">{rec.status}</Badge>;
  }
}

function QualityFigure({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: Tone | null;
}) {
  return (
    <div className="rounded-md bg-muted px-2 py-1.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`text-sm font-medium tabular-nums ${tone ? toneClass[tone] : ''}`}
      >
        {value}
      </div>
    </div>
  );
}

function RecordingQuality({ rec }: { rec: HiveScaleRecording }) {
  const { t } = useTranslation('hivescale');
  const dropped = rec.dropped_bytes ?? 0;
  const gaps = rec.gaps ?? 0;
  const overruns = rec.ring_overruns ?? 0;
  const clipped = rec.clipped_pct ?? 0;
  const confirmTone = confirmationTone(rec.confirmation);

  // Three counters, three different remedies (move the node, fix the radio
  // path, fix the hub's upload), so name each side rather than just "gaps".
  const causes: string[] = [];
  if (dropped) causes.push(t('audio.quality.cause.dropped'));
  if (gaps) causes.push(t('audio.quality.cause.gaps'));
  if (overruns) causes.push(t('audio.quality.cause.hubBuffer'));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <QualityFigure
          label={t('audio.quality.length')}
          value={
            rec.seconds
              ? t('audio.seconds', { value: rec.seconds.toFixed(1) })
              : DASH
          }
        />
        <QualityFigure
          label={t('audio.quality.dropped')}
          value={t('audio.bytes', { value: integerFormat.format(dropped) })}
          tone={dropped ? 'warn' : null}
        />
        <QualityFigure
          label={t('audio.quality.gaps')}
          value={integerFormat.format(gaps)}
          tone={gaps ? 'warn' : null}
        />
        <QualityFigure
          label={t('audio.quality.hubBuffer')}
          value={integerFormat.format(overruns)}
          tone={overruns ? 'warn' : null}
        />
        <QualityFigure
          label={t('audio.quality.clipping')}
          value={t('audio.percent', { value: clipped })}
          tone={clipped >= CLIPPING_WARN_PCT ? 'warn' : null}
        />
        <QualityFigure
          label={t('audio.quality.checksum')}
          value={confirmationLabel(t, rec.confirmation)}
          tone={confirmTone === 'muted' ? null : confirmTone}
        />
      </div>
      {causes.length > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          {t('audio.quality.gapNote', { causes: causes.join('; ') })}
        </p>
      )}
      {clipped >= CLIPPING_WARN_PCT && (
        <p className="text-xs text-muted-foreground">
          {t('audio.quality.clippingNote')}
        </p>
      )}
      {rec.confirmation === 'unknown' && (
        <p className="text-xs text-muted-foreground">
          {t('audio.quality.unknownNote')}
        </p>
      )}
    </div>
  );
}

function RecordingRow({
  rec,
  hiveNames,
  canWrite,
  deleting,
  onDelete,
}: {
  rec: HiveScaleRecording;
  hiveNames: HiveMappingBySlot;
  canWrite: boolean;
  deleting: boolean;
  onDelete: (rec: HiveScaleRecording) => void;
}) {
  const { t } = useTranslation('hivescale');
  const hasAudio = (rec.bytes ?? 0) > 0;
  const wavUrl = hiveScaleRecordingWavUrl(rec.id);
  const failure = rec.error || rec.hub_message;

  return (
    <li className="space-y-3 rounded-md border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <div className="font-medium">
            {hiveSlotName(
              hiveNames,
              rec.hive_index,
              t('audio.hiveFallback', { slot: rec.hive_index }),
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {[
              formatDateTime(rec.requested_at),
              rec.requested_duration_s
                ? t('audio.requestedLength', {
                    count: rec.requested_duration_s,
                  })
                : null,
              rec.gain_db != null
                ? t('audio.gainValue', { gain: formatGain(rec.gain_db) })
                : null,
              rec.requested_by
                ? t('audio.requestedBy', { name: rec.requested_by })
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
        <StatusBadge rec={rec} />
      </div>

      {rec.status === 'requested' && (
        <p className="text-xs text-muted-foreground">
          {t('audio.waitingNote')}
        </p>
      )}
      {rec.status === 'streaming' && (
        <p className="text-xs text-muted-foreground">
          {hasAudio ? t('audio.streamingPartial') : t('audio.streamingNote')}
        </p>
      )}
      {rec.status === 'failed' && (
        <p className="text-xs text-destructive">
          {failure || t('audio.failedFallback')}
        </p>
      )}
      {/* A ready row can still carry the server's note, e.g. that the hub
          never sent its report and the audio is unverified. */}
      {rec.status === 'ready' && rec.error && (
        <p className="text-xs text-muted-foreground">{rec.error}</p>
      )}

      {/* Offer the player whenever audio exists, as HiveHub does: a session
          still uploading or one the hub never reported on has a real file. */}
      {hasAudio && (
        <>
          <audio controls preload="none" src={wavUrl} className="w-full">
            <a href={wavUrl}>{t('audio.download')}</a>
          </audio>
          <RecordingQuality rec={rec} />
        </>
      )}

      {(hasAudio || canWrite) && (
        <div className="flex flex-wrap gap-2">
          {hasAudio && (
            <Button asChild variant="outline" size="sm">
              <a href={wavUrl} download={`hive${rec.hive_index}-${rec.id}.wav`}>
                <Download className="mr-2 h-4 w-4" />
                {t('audio.download')}
              </a>
            </Button>
          )}
          {canWrite && (
            <Button
              variant="ghost"
              size="sm"
              disabled={deleting}
              onClick={() => onDelete(rec)}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {t('audio.delete')}
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

export function HiveHubAudioPanel({
  device,
  latest,
  hiveNames,
}: {
  device: HiveScaleDevice;
  latest?: HiveScaleMeasurement;
  hiveNames: HiveMappingBySlot;
}) {
  const { t } = useTranslation('hivescale');
  const deviceId = device.device_id;
  const canWrite = device.role === 'owner' || device.role === 'admin';

  const nodes = useMemo(() => hiveInsideNodes(latest), [latest]);
  const [hiveChoice, setHiveChoice] = useState<string>('');
  const [duration, setDuration] = useState(String(DEFAULT_DURATION));
  const [gain, setGain] = useState('0');
  const [onlySelectedHive, setOnlySelectedHive] = useState(false);
  const [fastPoll, setFastPoll] = useState(false);

  // Fall back to the first node when the stored choice is gone (a node was
  // unpaired, or the device changed).
  const selectedSlot =
    nodes.find(node => String(node.slot) === hiveChoice)?.slot ??
    nodes[0]?.slot;

  const filterSlot = onlySelectedHive ? selectedSlot : undefined;
  const recordingsQuery = useHiveScaleRecordings(deviceId, filterSlot, {
    refetchInterval: fastPoll ? AUDIO_POLL_ACTIVE_MS : AUDIO_POLL_IDLE_MS,
  });
  const requestRecording = useRequestHiveScaleRecording(deviceId);
  const deleteRecording = useDeleteHiveScaleRecording(deviceId);

  const recordings = useMemo(
    () =>
      [...(recordingsQuery.data ?? [])].sort((a, b) => {
        const at = a.requested_at ? Date.parse(a.requested_at) : 0;
        const bt = b.requested_at ? Date.parse(b.requested_at) : 0;
        return bt - at || b.id - a.id;
      }),
    [recordingsQuery.data],
  );
  const anyInFlight = recordings.some(isInFlight);

  useEffect(() => {
    setFastPoll(anyInFlight);
  }, [anyInFlight]);

  const nodeLabel = (node: HiveInsideNode) => {
    const name = hiveSlotName(
      hiveNames,
      node.slot,
      t('audio.hiveFallback', { slot: node.slot }),
    );
    return node.deviceName ? `${name} (${node.deviceName})` : name;
  };

  const record = () => {
    if (selectedSlot == null) return;
    requestRecording.mutate(
      {
        hive: selectedSlot,
        duration: Number(duration),
        gain_db: Number(gain),
      },
      {
        onSuccess: () => {
          setFastPoll(true);
          toast.success(t('audio.requestSuccess'));
        },
        onError: error =>
          toast.error(
            t('audio.requestError', {
              message: error.message || t('common.unknownError'),
            }),
          ),
      },
    );
  };

  const remove = (rec: HiveScaleRecording) => {
    if (!globalThis.confirm(t('audio.deleteConfirm'))) return;
    deleteRecording.mutate(rec.id, {
      onSuccess: () => toast.success(t('audio.deleteSuccess')),
      onError: error =>
        toast.error(
          t('audio.deleteError', {
            message: error.message || t('common.unknownError'),
          }),
        ),
    });
  };

  const selectedNode = nodes.find(node => node.slot === selectedSlot);
  const deletingId = deleteRecording.isPending
    ? deleteRecording.variables
    : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          {t('audio.title')}
        </CardTitle>
        <CardDescription>{t('audio.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {nodes.length === 0 ? (
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            {t('audio.noNodes')}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="hivehub-audio-hive">{t('audio.hive')}</Label>
                <Select
                  value={selectedSlot != null ? String(selectedSlot) : ''}
                  onValueChange={setHiveChoice}
                >
                  <SelectTrigger id="hivehub-audio-hive" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes.map(node => (
                      <SelectItem key={node.slot} value={String(node.slot)}>
                        {nodeLabel(node)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hivehub-audio-length">
                  {t('audio.length')}
                </Label>
                <Select
                  value={duration}
                  onValueChange={setDuration}
                  disabled={!canWrite}
                >
                  <SelectTrigger id="hivehub-audio-length" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIO_DURATIONS.map(seconds => (
                      <SelectItem key={seconds} value={String(seconds)}>
                        {t('audio.durationOption', { count: seconds })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hivehub-audio-gain">{t('audio.gain')}</Label>
                <Select
                  value={gain}
                  onValueChange={setGain}
                  disabled={!canWrite}
                >
                  <SelectTrigger id="hivehub-audio-gain" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIO_GAINS.map(value => (
                      <SelectItem key={value} value={String(value)}>
                        {t('audio.gainValue', { gain: formatGain(value) })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={record}
                disabled={
                  !canWrite ||
                  selectedSlot == null ||
                  requestRecording.isPending
                }
              >
                {requestRecording.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mic className="mr-2 h-4 w-4" />
                )}
                {t('audio.record')}
              </Button>
              <p className="text-xs text-muted-foreground">
                {canWrite ? t('audio.nextWake') : t('audio.viewerNote')}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('audio.lengthHint')}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium">{t('audio.listTitle')}</h3>
            {selectedNode && (
              <div className="flex items-center gap-2">
                <Switch
                  id="hivehub-audio-filter"
                  checked={onlySelectedHive}
                  onCheckedChange={setOnlySelectedHive}
                />
                <Label
                  htmlFor="hivehub-audio-filter"
                  className="text-xs font-normal text-muted-foreground"
                >
                  {t('audio.onlySelectedHive', {
                    name: hiveSlotName(
                      hiveNames,
                      selectedNode.slot,
                      t('audio.hiveFallback', { slot: selectedNode.slot }),
                    ),
                  })}
                </Label>
              </div>
            )}
          </div>

          {recordingsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : recordingsQuery.isError ? (
            <p className="text-sm text-destructive">
              {t('audio.loadError', {
                message:
                  recordingsQuery.error?.message || t('common.unknownError'),
              })}
            </p>
          ) : recordings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('audio.empty')}</p>
          ) : (
            <ul className="space-y-3">
              {recordings.map(rec => (
                <RecordingRow
                  key={rec.id}
                  rec={rec}
                  hiveNames={hiveNames}
                  canWrite={canWrite}
                  deleting={deletingId === rec.id}
                  onDelete={remove}
                />
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
