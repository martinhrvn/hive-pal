import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useApproveHiveScaleFirmware,
  useHiveScaleFirmwareStatus,
  useQueueBeeCounterUpdate,
  useQueueHiveInsideUpdate,
  useUploadHiveScaleFirmware,
  type HiveScaleDevice,
  type HiveScaleFirmwareBoard,
  type HiveScaleFirmwareStatus,
  type HiveScaleFirmwareTarget,
  type HiveScaleMeasurement,
  type HiveScaleRelayStatus,
} from '@/api/hooks/useHiveScale';
import { hiveSlotName, type HiveMappingBySlot } from './hivehub-links';
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
import { cn } from '@/lib/utils';

const DASH = '—';
const RELAY_POLL_MS = 10_000;

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const formatDate = (value: string | null | undefined) => {
  if (!value) return DASH;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? DASH : dateFormat.format(date);
};

const badgeTone = {
  warn: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  good: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  danger: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
  muted: 'text-muted-foreground',
} as const;

/**
 * Numeric, component-wise version compare ("0.10.0" > "0.9.9"), mirroring
 * HiveHub's parse_version so an "update available" flag never promises a
 * relay the server would refuse as not newer.
 */
const versionIsNewer = (
  a: string | null | undefined,
  b: string | null | undefined,
) => {
  const parse = (v: string | null | undefined) =>
    String(v ?? '')
      .split('.')
      .map(part => Number.parseInt(part.replace(/\D/g, ''), 10) || 0);
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d) return d > 0;
  }
  return false;
};

// ── Filename detection (same rules as HiveHub's dashboard and firmware.py) ──

/**
 * The v-stamped token is tried first because the trailing-token rule would
 * drag "-lowpower.signed" into the version of a HiveInside Zephyr artifact.
 */
const versionFromFilename = (name: string) => {
  const base = name.replace(/\.[^.]*$/, '');
  const stamped = /[-_]v(\d+\.\d+(?:\.\d+)*)(?=[-_.]|$)/i.exec(base);
  if (stamped) return stamped[1];
  const m = /(\d+\.\d+(?:\.\d+)*(?:[-_][0-9A-Za-z.]+)?)$/.exec(base);
  return m ? m[1] : '';
};

type UploadTarget = 'hivehub' | 'hiveinside' | 'beecounter';

const targetFromFilename = (name: string): UploadTarget | '' => {
  const n = name.toLowerCase();
  if (/hiveinside/.test(n)) return 'hiveinside';
  if (/hivetraffic|beecounter/.test(n)) return 'beecounter';
  if (/hivehub|hivescale/.test(n)) return 'hivehub';
  return '';
};

// 'esp32-c6' contains 'esp32', so the C6 token has to be matched first.
const boardFromFilename = (name: string): HiveScaleFirmwareBoard | null => {
  const n = name.toLowerCase();
  if (n.includes('nrf54')) return 'nrf54lm20a';
  if (n.includes('esp32-c6') || n.includes('esp32c6') || n.includes('xiao'))
    return 'esp32-c6';
  if (n.includes('esp32')) return 'esp32';
  return null;
};

// HiveHub refuses a board that is not valid for the target, or that disagrees
// with the board token in the filename, so only valid pairs are offered.
const BOARDS_BY_TARGET: Record<UploadTarget, HiveScaleFirmwareBoard[]> = {
  hivehub: ['esp32', 'esp32-c6'],
  hiveinside: ['nrf54lm20a'],
  beecounter: ['esp32-c6'],
};

type BoardChoice = HiveScaleFirmwareBoard | 'auto';

// ── Nodes carried by the hub ────────────────────────────────────────────────

type RelayKind = 'hiveinside' | 'beecounter';

interface RelayNode {
  slot: number;
  name: string;
  deviceName: string | null;
  mac: string | null;
  version: string | null;
  board: string | null;
}

const relayNodes = (
  latest: HiveScaleMeasurement | undefined,
  kind: RelayKind,
  hiveNames: HiveMappingBySlot,
  t: TFunction,
): RelayNode[] => {
  const nodes: RelayNode[] = [];
  for (const hive of latest?.hives ?? []) {
    const slot = Number(hive.index);
    if (!slot) continue;
    const name = hiveSlotName(
      hiveNames,
      slot,
      t('firmware.relays.hiveFallback', { slot }),
    );
    if (kind === 'hiveinside') {
      const ble = hive.ble;
      if (
        !ble ||
        !(
          /hiveinside/i.test(ble.sensor_type ?? '') ||
          /nrf54/i.test(ble.board ?? '')
        )
      )
        continue;
      nodes.push({
        slot,
        name,
        deviceName: ble.device_name ?? null,
        mac: ble.mac ?? null,
        version: ble.firmware_version ?? null,
        board: ble.board ?? null,
      });
    } else {
      // A paired but unreachable counter still reports ok:false, and stays
      // listed so a failed relay to it remains visible.
      const counter = hive.bee_counter;
      if (!counter) continue;
      nodes.push({
        slot,
        name,
        deviceName: counter.device_name ?? null,
        mac: counter.mac ?? null,
        version: counter.version ?? null,
        board: null,
      });
    }
  }
  return nodes.sort((a, b) => a.slot - b.slot);
};

const relayInFlight = (relay: HiveScaleRelayStatus | undefined) =>
  !!relay &&
  (relay.status === 'pending' ||
    relay.status === 'claimed' ||
    relay.status === 'running');

const relayFailed = (relay: HiveScaleRelayStatus | undefined) =>
  !!relay && (relay.status === 'failed' || relay.status === 'expired');

// HiveHub answers 409 "… is not newer … pass force=true to relay it anyway";
// the proxy keeps only the message, so that is what identifies the refusal.
const isNotNewerRefusal = (message: string) =>
  /not newer|force=true/i.test(message);

// ── Hub status ──────────────────────────────────────────────────────────────

function HubStatusSection({
  status,
  isLoading,
  canManage,
  deviceId,
}: Readonly<{
  status: HiveScaleFirmwareStatus | undefined;
  isLoading: boolean;
  canManage: boolean;
  deviceId: string;
}>) {
  const { t } = useTranslation('hivescale');
  const approveFirmware = useApproveHiveScaleFirmware(deviceId);

  const onApprove = () => {
    if (!status) return;
    if (
      !globalThis.confirm(
        t('firmware.board.approveConfirm', {
          version: status.latest_version ?? DASH,
        }),
      )
    )
      return;
    approveFirmware.mutate(undefined, {
      onSuccess: result =>
        toast.success(
          t('firmware.update.applied', { version: result.version }),
        ),
      onError: error => toast.error(error.message),
    });
  };

  let body: ReactNode;
  if (isLoading) {
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
                current: status.current_version ?? DASH,
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
            onClick={onApprove}
            disabled={approveFirmware.isPending}
          >
            {approveFirmware.isPending
              ? t('firmware.update.applying')
              : t('firmware.board.approveFlash', {
                  version: status.latest_version ?? '',
                })}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('firmware.update.viewerNotice')}
          </p>
        )}
      </div>
    );
  } else if (status.update_available) {
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
            version: status.current_version ?? DASH,
          })}
        </p>
      </div>
    );
  }

  let badge: ReactNode = null;
  if (status) {
    const tone = status.update_available
      ? status.pending_approval
        ? 'warn'
        : 'info'
      : 'good';
    const label = status.update_available
      ? status.pending_approval
        ? t('firmware.board.badgePending')
        : t('firmware.board.badgeApproved')
      : t('firmware.board.badgeUpToDate');
    badge = (
      <Badge variant="outline" className={badgeTone[tone]}>
        {label}
      </Badge>
    );
  }

  const otherBoards = status?.other_board_releases ?? [];

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-sm font-medium">{t('firmware.update.title')}</p>
            <p className="text-xs text-muted-foreground">
              {t('firmware.update.description')}
            </p>
          </div>
        </div>
        {badge}
      </div>

      {status && (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {(
            [
              ['current', status.current_version],
              ['latest', status.latest_version],
              ['approved', status.approved_version],
              ['board', status.device_board],
            ] as const
          ).map(([key, value]) => (
            <div key={key} className="rounded-md bg-muted/50 px-3 py-2">
              <dt className="text-xs text-muted-foreground">
                {t(`firmware.board.${key}`)}
              </dt>
              <dd className="font-medium tabular-nums">{value || DASH}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Without this an upload for the wrong board looks like it vanished. */}
      {otherBoards.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs text-muted-foreground">
            {t(
              status?.device_board
                ? 'firmware.board.otherBoards'
                : 'firmware.board.otherBoardsUnknown',
              {
                board: status?.device_board,
                releases: otherBoards
                  .map(release => `${release.board} ${release.version}`)
                  .join(', '),
              },
            )}
          </p>
        </div>
      )}

      {body}
    </div>
  );
}

// ── Sub-device relays ───────────────────────────────────────────────────────

function RelayBadge({ relay }: Readonly<{ relay?: HiveScaleRelayStatus }>) {
  const { t } = useTranslation('hivescale');
  if (!relay) return null;
  let tone: keyof typeof badgeTone;
  let label: string;
  switch (relay.status) {
    case 'pending':
      tone = 'info';
      label = t('firmware.relays.status.pending');
      break;
    case 'claimed':
    case 'running':
      tone = 'info';
      label = t('firmware.relays.status.running');
      break;
    case 'completed':
      tone = 'good';
      label = t('firmware.relays.status.completed');
      break;
    case 'failed':
      tone = 'danger';
      label = t('firmware.relays.status.failed');
      break;
    case 'expired':
      tone = 'danger';
      label = t('firmware.relays.status.expired');
      break;
    default:
      return null;
  }
  return (
    <Badge
      variant="outline"
      className={badgeTone[tone]}
      title={t('firmware.relays.statusTitle', {
        version: relay.version ?? DASH,
        status: relay.status,
        date: formatDate(relay.completed_at ?? relay.created_at),
      })}
    >
      {label}
    </Badge>
  );
}

function RelaySection({
  kind,
  nodes,
  status,
  canManage,
  deviceId,
}: Readonly<{
  kind: RelayKind;
  nodes: RelayNode[];
  status: HiveScaleFirmwareStatus | undefined;
  canManage: boolean;
  deviceId: string;
}>) {
  const { t } = useTranslation('hivescale');
  const queueHiveInside = useQueueHiveInsideUpdate(deviceId);
  const queueBeeCounter = useQueueBeeCounterUpdate(deviceId);
  const queue = kind === 'hiveinside' ? queueHiveInside : queueBeeCounter;
  // Slots whose last relay was refused as "not newer", with HiveHub's message,
  // so the row can offer a forced relay.
  const [refused, setRefused] = useState<Record<number, string>>({});
  const [busySlot, setBusySlot] = useState<number | null>(null);

  if (nodes.length === 0) return null;

  const prefix = `firmware.relays.${kind}`;
  const latest =
    (kind === 'hiveinside'
      ? status?.hiveinside_latest_version
      : status?.beecounter_latest_version) ?? null;
  const relays =
    (kind === 'hiveinside'
      ? status?.hiveinside_relays
      : status?.beecounter_relays) ?? {};

  const startRelay = (node: RelayNode, force: boolean) => {
    const confirmText = [
      t('firmware.relays.confirm', {
        name: t(`${prefix}.name`),
        version: latest ?? DASH,
        hive: node.name,
      }),
      kind === 'beecounter' ? t('firmware.relays.beecounter.confirmExtra') : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    if (!globalThis.confirm(confirmText)) return;
    setBusySlot(node.slot);
    queue.mutate(
      { slot: node.slot, force },
      {
        onSuccess: result => {
          setRefused(prev => {
            const next = { ...prev };
            delete next[node.slot];
            return next;
          });
          const version = result.version ?? latest ?? DASH;
          toast.success(
            result.current_version
              ? t('firmware.relays.queuedFrom', {
                  hive: node.name,
                  current: result.current_version,
                  version,
                })
              : t('firmware.relays.queued', { hive: node.name, version }),
          );
        },
        onError: error => {
          if (!force && isNotNewerRefusal(error.message)) {
            setRefused(prev => ({ ...prev, [node.slot]: error.message }));
          }
          toast.error(error.message);
        },
        onSettled: () => setBusySlot(null),
      },
    );
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-start gap-2">
        <Cpu className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-sm font-medium">{t(`${prefix}.title`)}</p>
          <p className="text-xs text-muted-foreground">
            {t(`${prefix}.description`)}
          </p>
        </div>
      </div>

      {kind === 'beecounter' && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs text-muted-foreground">
            {t('firmware.relays.beecounter.countingWarning')}
          </p>
        </div>
      )}

      <div className="divide-y">
        {nodes.map(node => {
          const relay = relays[String(node.slot)];
          const inFlight = relayInFlight(relay);
          const updateAvailable =
            !!latest && (!node.version || versionIsNewer(latest, node.version));
          const refusal = refused[node.slot];
          const busy = busySlot === node.slot && queue.isPending;
          const identity = [node.deviceName, node.mac]
            .filter(Boolean)
            .join(' · ');
          return (
            <div
              key={node.slot}
              className="space-y-2 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{node.name}</p>
                  <p
                    className="truncate text-xs text-muted-foreground"
                    title={identity || undefined}
                  >
                    {identity || t(`${prefix}.unnamed`)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium tabular-nums">
                    {[node.version ? `v${node.version}` : DASH, node.board]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  {latest && (
                    <Badge
                      variant="outline"
                      className={
                        updateAvailable ? badgeTone.warn : badgeTone.muted
                      }
                    >
                      {updateAvailable
                        ? t('firmware.relays.updateAvailable', {
                            version: latest,
                          })
                        : t('firmware.relays.latest', { version: latest })}
                    </Badge>
                  )}
                  <RelayBadge relay={relay} />
                </div>
              </div>

              {relayFailed(relay) && (
                <p className="text-xs text-red-700 dark:text-red-300">
                  {t('firmware.relays.failedDetail', {
                    message: relay?.message || t('firmware.relays.noReason'),
                    date: formatDate(relay?.completed_at ?? relay?.created_at),
                  })}
                </p>
              )}

              {refusal && (
                <p className="text-xs text-muted-foreground">{refusal}</p>
              )}

              {canManage && latest && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={updateAvailable ? 'default' : 'outline'}
                    disabled={inFlight || busy}
                    title={
                      inFlight ? t('firmware.relays.alreadyQueued') : undefined
                    }
                    onClick={() => startRelay(node, false)}
                  >
                    {busy
                      ? t('firmware.relays.queueing')
                      : t(`${prefix}.relay`)}
                  </Button>
                  {refusal && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={inFlight || busy}
                      onClick={() => startRelay(node, true)}
                    >
                      {t('firmware.relays.relayAnyway')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!latest && (
        <p className="text-xs text-muted-foreground">
          {t(`${prefix}.noRelease`)}
        </p>
      )}
    </div>
  );
}

// ── Upload ──────────────────────────────────────────────────────────────────

function FirmwareUploadForm({
  deviceId,
  canManage,
  hiveNames,
}: Readonly<{
  deviceId: string;
  canManage: boolean;
  hiveNames: HiveMappingBySlot;
}>) {
  const { t } = useTranslation('hivescale');
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [target, setTarget] = useState<UploadTarget>('hivehub');
  const [board, setBoard] = useState<BoardChoice>('auto');
  const [detected, setDetected] = useState<string | null>(null);
  // Reset key lets us clear the native file input after a successful upload.
  const [fileInputKey, setFileInputKey] = useState(0);

  const uploadFirmware = useUploadHiveScaleFirmware(deviceId);
  const disabled = !canManage || uploadFirmware.isPending;
  const boards = BOARDS_BY_TARGET[target];

  const changeTarget = (next: UploadTarget) => {
    setTarget(next);
    if (board !== 'auto' && !BOARDS_BY_TARGET[next].includes(board)) {
      setBoard('auto');
    }
  };

  // A silently switched Target select is easy to miss, so say what was
  // recognized in the filename — and when nothing was.
  const onFileChange = (picked: File | null) => {
    setFile(picked);
    if (!picked) {
      setDetected(null);
      return;
    }
    const name = picked.name;
    const nextVersion = versionFromFilename(name);
    const nextTarget = targetFromFilename(name) || target;
    const nextBoard = boardFromFilename(name);
    if (nextVersion) setVersion(nextVersion);
    setTarget(nextTarget);
    setBoard(
      nextBoard && BOARDS_BY_TARGET[nextTarget].includes(nextBoard)
        ? nextBoard
        : 'auto',
    );
    const filled = [
      targetFromFilename(name)
        ? t('firmware.uploadForm.detectedTarget', {
            target: t(`firmware.uploadForm.targets.${nextTarget}`),
          })
        : '',
      nextBoard
        ? t('firmware.uploadForm.detectedBoard', { board: nextBoard })
        : '',
      nextVersion
        ? t('firmware.uploadForm.detectedVersion', { version: nextVersion })
        : '',
    ].filter(Boolean);
    setDetected(
      filled.length
        ? t('firmware.uploadForm.detected', {
            name,
            fields: filled.join(', '),
          })
        : t('firmware.uploadForm.nothingDetected', { name }),
    );
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canManage) return;
    if (!file) {
      toast.error(t('firmware.errors.missingFile'));
      return;
    }
    const normalizedVersion = version.trim();
    if (!normalizedVersion) {
      toast.error(t('firmware.errors.missingVersion'));
      return;
    }

    const hiveList = (slots: number[]) =>
      slots
        .map(slot =>
          hiveSlotName(
            hiveNames,
            slot,
            t('firmware.relays.hiveFallback', { slot }),
          ),
        )
        .join(', ');

    uploadFirmware.mutate(
      {
        file,
        version: normalizedVersion,
        target: target satisfies HiveScaleFirmwareTarget,
        ...(board === 'auto' ? {} : { board }),
        active: true,
      },
      {
        onSuccess: result => {
          setFile(null);
          setVersion('');
          setDetected(null);
          setFileInputKey(key => key + 1);
          toast.success(
            t('firmware.success', {
              version: result.version,
              target: result.target,
            }),
          );
          // Sub-device uploads may auto-queue relays to every hive reporting
          // such a node; say which were queued and which failed.
          const autoQueued = result.auto_queued_updates ?? [];
          const queued = autoQueued
            .filter(update => update.status === 'queued')
            .map(update => update.slot);
          const failed = autoQueued.filter(
            update => update.status === 'failed',
          );
          if (queued.length > 0) {
            toast.success(
              t('firmware.uploadForm.autoQueued', { hives: hiveList(queued) }),
            );
          }
          if (failed.length > 0) {
            toast.error(
              t('firmware.uploadForm.autoQueueFailed', {
                hives: hiveList(failed.map(update => update.slot)),
              }),
              {
                description:
                  failed
                    .map(update => update.error)
                    .filter(Boolean)
                    .join('; ') || undefined,
              },
            );
          }
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Upload className="h-4 w-4" />
          {t('firmware.uploadForm.title')}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('firmware.uploadForm.description')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hivehub-firmware-file">{t('firmware.binary')}</Label>
        <Input
          key={fileInputKey}
          id="hivehub-firmware-file"
          type="file"
          accept=".bin,application/octet-stream"
          onChange={event => onFileChange(event.target.files?.[0] ?? null)}
          disabled={disabled}
        />
        {file && (
          <p className="text-xs text-muted-foreground">
            {file.name} ({(file.size / 1024).toFixed(0)} KB)
          </p>
        )}
        {detected && (
          <p className="text-xs text-muted-foreground">{detected}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hivehub-firmware-target">{t('firmware.type')}</Label>
          <Select
            value={target}
            onValueChange={value => changeTarget(value as UploadTarget)}
            disabled={disabled}
          >
            <SelectTrigger id="hivehub-firmware-target" className="w-full">
              <SelectValue placeholder={t('firmware.selectType')} />
            </SelectTrigger>
            <SelectContent>
              {(['hivehub', 'hiveinside', 'beecounter'] as const).map(value => (
                <SelectItem key={value} value={value}>
                  {t(`firmware.uploadForm.targets.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hivehub-firmware-board">
            {t('firmware.uploadForm.board')}
          </Label>
          <Select
            value={board}
            onValueChange={value => setBoard(value as BoardChoice)}
            disabled={disabled}
          >
            <SelectTrigger id="hivehub-firmware-board" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                {t('firmware.uploadForm.boards.auto')}
              </SelectItem>
              {boards.map(value => (
                <SelectItem key={value} value={value}>
                  {t(`firmware.uploadForm.boards.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {t(`firmware.uploadForm.boardHint.${target}`)}
      </p>

      <div className="space-y-2">
        <Label htmlFor="hivehub-firmware-version">
          {t('firmware.version')}
        </Label>
        <Input
          id="hivehub-firmware-version"
          value={version}
          onChange={event => setVersion(event.target.value)}
          placeholder="0.30.5"
          disabled={disabled}
        />
      </div>

      <Button type="submit" className="w-full" disabled={disabled}>
        {uploadFirmware.isPending
          ? t('firmware.uploading')
          : t('firmware.upload')}
      </Button>
    </form>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────

export function HiveHubFirmwareCard({
  device,
  latest,
  hiveNames,
}: Readonly<{
  device: HiveScaleDevice;
  latest?: HiveScaleMeasurement;
  hiveNames: HiveMappingBySlot;
}>) {
  const { t } = useTranslation('hivescale');
  const deviceId = device.device_id;
  const canManage = device.role === 'owner' || device.role === 'admin';

  const statusQuery = useHiveScaleFirmwareStatus(deviceId);
  const status = statusQuery.data;
  const { refetch } = statusQuery;

  // A relay takes minutes and only reports back through the firmware status,
  // so poll while one is queued or running and stop once all have settled.
  const relayActive = [
    ...Object.values(status?.hiveinside_relays ?? {}),
    ...Object.values(status?.beecounter_relays ?? {}),
  ].some(relayInFlight);
  useEffect(() => {
    if (!relayActive) return;
    const timer = setInterval(() => void refetch(), RELAY_POLL_MS);
    return () => clearInterval(timer);
  }, [relayActive, refetch]);

  const insideNodes = relayNodes(latest, 'hiveinside', hiveNames, t);
  const counterNodes = relayNodes(latest, 'beecounter', hiveNames, t);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          {t('firmware.board.cardTitle')}
        </CardTitle>
        <CardDescription>{t('firmware.board.cardDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!canManage && (
          <p className="text-sm text-muted-foreground">
            {t('firmware.notice.noPermission', { role: device.role })}
          </p>
        )}

        <HubStatusSection
          status={status}
          isLoading={statusQuery.isLoading}
          canManage={canManage}
          deviceId={deviceId}
        />

        <RelaySection
          kind="hiveinside"
          nodes={insideNodes}
          status={status}
          canManage={canManage}
          deviceId={deviceId}
        />
        <RelaySection
          kind="beecounter"
          nodes={counterNodes}
          status={status}
          canManage={canManage}
          deviceId={deviceId}
        />

        <div className={cn('border-t pt-4', !canManage && 'opacity-60')}>
          <FirmwareUploadForm
            deviceId={deviceId}
            canManage={canManage}
            hiveNames={hiveNames}
          />
        </div>
      </CardContent>
    </Card>
  );
}
