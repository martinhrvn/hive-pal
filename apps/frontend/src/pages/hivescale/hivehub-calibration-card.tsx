import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  CheckCircle2,
  ChevronDown,
  Info,
  Play,
  Square,
  Thermometer,
  Weight,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  flatHiveField,
  useFitHiveScaleTempCompensation,
  useHiveScaleDeviceConfig,
  useStartHiveScaleCalibrationMode,
  useStopHiveScaleCalibrationMode,
  useUpdateHiveScaleConfig,
  type HiveScaleConfigPatch,
  type HiveScaleDevice,
  type HiveScaleDeviceConfig,
  type HiveScaleMeasurement,
  type HiveScaleTempCompensationFitResult,
  type HiveScaleTempcoSource,
} from '@/api/hooks/useHiveScale';
import { MAX_HIVE_SLOTS, type HiveMappingBySlot } from './hivehub-links';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Firmware defaults for a hive 3..18 without a stored hive_scales entry: the
// values it is actually running with, so an untouched hive shows the truth.
const HIVE_SCALE_DEFAULTS = { offset: 0, factor: -7050, tempco: 0 };
const FAST_MODE = { interval_seconds: 5, timeout_seconds: 600 };
const DEFAULT_FIT_LOOKBACK_DAYS = 3;
const LOW_R_SQUARED = 0.5;

type CapturedRawReading = {
  raw: number;
  measuredAt: string;
};

type HiveOption = {
  index: number;
  /** Short name for messages: the hive name, or "Hive N". */
  name: string;
  /** Selector label: "Hive N · name" when named. */
  label: string;
};

type ScaleDraft = { offset: string; factor: string; knownWeightKg: string };

const numberOrDash = (value: number | null | undefined, digits = 1) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : '—';

const formatDateTime = (value: string | null | undefined, t: TFunction) => {
  if (!value) return t('common.never');
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const hasValidRaw = (raw: number | null | undefined): raw is number =>
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

/** Latest raw count for a hive: the canonical hives[] row, else the flat alias. */
const hiveRaw = (
  latest: HiveScaleMeasurement | undefined,
  index: number,
): number | null => {
  const nested = latest?.hives?.find(h => h.index === index)?.raw_weight;
  if (hasValidRaw(nested)) return nested;
  const flat = flatHiveField<number>(latest, 'scale', index, 'raw');
  return hasValidRaw(flat) ? flat : null;
};

const storedHiveScale = (
  config: HiveScaleDeviceConfig | undefined,
  index: number,
) => config?.hive_scales?.find(h => Number(h.index) === index);

/** Offset/factor as stored for a hive (hives 1–2 have dedicated columns). */
const storedCalibration = (
  config: HiveScaleDeviceConfig | undefined,
  index: number,
) => {
  if (index === 1)
    return { offset: config?.scale1_offset, factor: config?.scale1_factor };
  if (index === 2)
    return { offset: config?.scale2_offset, factor: config?.scale2_factor };
  const entry = storedHiveScale(config, index);
  return {
    offset: entry?.offset ?? HIVE_SCALE_DEFAULTS.offset,
    factor: entry?.factor ?? HIVE_SCALE_DEFAULTS.factor,
  };
};

const storedTempco = (
  config: HiveScaleDeviceConfig | undefined,
  index: number,
) => {
  if (index === 1) return config?.scale1_tempco_kg_per_c ?? 0;
  if (index === 2) return config?.scale2_tempco_kg_per_c ?? 0;
  return (
    storedHiveScale(config, index)?.tempco_kg_per_c ??
    HIVE_SCALE_DEFAULTS.tempco
  );
};

const initialScaleDraft = (
  config: HiveScaleDeviceConfig | undefined,
  index: number,
): ScaleDraft => {
  const stored = storedCalibration(config, index);
  return {
    offset: stored.offset === undefined ? '' : String(stored.offset),
    factor: stored.factor === undefined ? '' : String(stored.factor),
    knownWeightKg: '',
  };
};

/**
 * Hives 1 and 2 always, plus every hive the device reports or has a stored
 * calibration for — so a calibrated hive stays editable while it is offline.
 */
const useHiveOptions = (
  latest: HiveScaleMeasurement | undefined,
  config: HiveScaleDeviceConfig | undefined,
  hiveNames: HiveMappingBySlot,
  t: TFunction,
): HiveOption[] =>
  useMemo(() => {
    const indices = new Set<number>([1, 2]);
    for (const hive of latest?.hives ?? []) indices.add(hive.index);
    for (const entry of config?.hive_scales ?? [])
      indices.add(Number(entry.index));
    return [...indices]
      .filter(n => Number.isInteger(n) && n >= 1 && n <= MAX_HIVE_SLOTS)
      .sort((a, b) => a - b)
      .map(index => {
        const named = hiveNames[index]?.trim();
        return {
          index,
          name: named || t('calibration.perHive.hive', { index }),
          label: named
            ? t('calibration.perHive.hiveNamed', { index, name: named })
            : t('calibration.perHive.hive', { index }),
        };
      });
  }, [latest?.hives, config?.hive_scales, hiveNames, t]);

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
  if (offset.trim() === '' || !Number.isFinite(parsedOffset)) {
    return { error: t('calibration.errors.validOffset', { scaleName }) };
  }

  const parsedKnownWeightKg = Number(knownWeightKg);
  if (!Number.isFinite(parsedKnownWeightKg) || parsedKnownWeightKg <= 0) {
    return { error: t('calibration.errors.knownWeight', { scaleName }) };
  }

  const factor = (raw - parsedOffset) / parsedKnownWeightKg;
  if (!Number.isFinite(factor) || factor === 0) {
    return {
      error: t('calibration.errors.factorNotCalculated', { scaleName }),
    };
  }

  return { factor: Number(factor.toPrecision(12)).toString() };
};

/** The config patch that writes offset/factor for one hive. */
const calibrationPatch = (
  index: number,
  offset: number,
  factor: number,
): HiveScaleConfigPatch => {
  if (index === 1) return { scale1_offset: offset, scale1_factor: factor };
  if (index === 2) return { scale2_offset: offset, scale2_factor: factor };
  return { hive_scales: [{ index, offset, factor }] };
};

const HiveSelect = ({
  id,
  options,
  value,
  onChange,
}: {
  id: string;
  options: HiveOption[];
  value: number;
  onChange: (index: number) => void;
}) => (
  <Select value={String(value)} onValueChange={v => onChange(Number(v))}>
    <SelectTrigger id={id} className="w-full">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map(option => (
        <SelectItem key={option.index} value={String(option.index)}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export function HiveHubCalibrationCard({
  device,
  latest,
  hiveNames,
  onCalibrationPollingChange,
}: Readonly<{
  device: HiveScaleDevice;
  latest: HiveScaleMeasurement | undefined;
  hiveNames: HiveMappingBySlot;
  onCalibrationPollingChange: (on: boolean) => void;
}>) {
  const { t } = useTranslation('hivescale');
  const queryClient = useQueryClient();
  const deviceId = device.device_id;
  const { data: config, isLoading } = useHiveScaleDeviceConfig(deviceId);
  const updateConfig = useUpdateHiveScaleConfig(deviceId);
  const startCalibrationMode = useStartHiveScaleCalibrationMode(deviceId);
  const stopCalibrationMode = useStopHiveScaleCalibrationMode(deviceId);
  const hiveOptions = useHiveOptions(latest, config, hiveNames, t);

  const [sendInterval, setSendInterval] = useState('');
  // Only edited hives are kept here; the rest read straight from the config.
  const [drafts, setDrafts] = useState<Record<number, ScaleDraft>>({});
  const [advancedHive, setAdvancedHive] = useState(1);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [calibrationQueued, setCalibrationQueued] = useState(false);
  const [activeHive, setActiveHive] = useState(1);
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
    setDrafts({});
  }, [config]);

  useEffect(() => {
    setEmptyCapture(null);
    setLoadedCapture(null);
    setKnownWeightKg('');
  }, [activeHive, deviceId]);

  useEffect(() => {
    if (latest?.calibration_mode === true) {
      setCalibrationQueued(false);
      onCalibrationPollingChange(true);
    }
  }, [latest?.calibration_mode, onCalibrationPollingChange]);

  const canConfigure = device.role === 'owner' || device.role === 'admin';
  const optionFor = (index: number): HiveOption =>
    hiveOptions.find(o => o.index === index) ?? {
      index,
      name: t('calibration.perHive.hive', { index }),
      label: t('calibration.perHive.hive', { index }),
    };
  const activeHiveName = optionFor(activeHive).name;
  const latestRaw = hiveRaw(latest, activeHive);
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

  const draftFor = (index: number) =>
    drafts[index] ?? initialScaleDraft(config, index);
  const updateDraft = (index: number, change: Partial<ScaleDraft>) =>
    setDrafts(prev => ({
      ...prev,
      [index]: {
        ...(prev[index] ?? initialScaleDraft(config, index)),
        ...change,
      },
    }));

  const invalidateHiveScaleData = () => {
    queryClient.invalidateQueries({ queryKey: ['hivescale'] });
  };

  const startFastMode = () => {
    if (!canConfigure) return;
    startCalibrationMode.mutate(FAST_MODE, {
      onSuccess: () => {
        setCalibrationQueued(true);
        onCalibrationPollingChange(true);
        invalidateHiveScaleData();
        toast.success(t('calibration.toasts.modeQueued'));
      },
      onError: error => toast.error(error.message),
    });
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
        t('calibration.errors.noLatestRaw', { scaleName: activeHiveName }),
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

    return { raw: latestRaw, measuredAt: latest.measured_at };
  };

  const captureEmptyRaw = () => {
    const capture = captureLatestRaw('empty');
    if (!capture) return;
    setEmptyCapture(capture);
    setLoadedCapture(null);
    toast.success(
      t('calibration.toasts.emptyCaptured', { scaleName: activeHiveName }),
    );
  };

  const captureLoadedRaw = () => {
    const capture = captureLatestRaw('loaded');
    if (!capture) return;
    setLoadedCapture(capture);
    toast.success(
      t('calibration.toasts.weightedCaptured', { scaleName: activeHiveName }),
    );
  };

  const saveWizardCalibration = () => {
    if (!config || !emptyCapture || calculatedFactor === null) return;
    const hive = activeHive;
    const offset = Math.round(emptyCapture.raw);

    updateConfig.mutate(calibrationPatch(hive, offset, calculatedFactor), {
      onSuccess: () => {
        updateDraft(hive, {
          offset: String(offset),
          factor: String(calculatedFactor),
        });
        toast.success(
          t('calibration.toasts.calibrationSaved', {
            scaleName: activeHiveName,
          }),
        );
        stopFastMode(false);
        setIsWizardOpen(false);
      },
      onError: error => toast.error(error.message),
    });
  };

  const saveConfig = () => {
    const parsedSendInterval = Number(sendInterval);
    if (
      !Number.isFinite(parsedSendInterval) ||
      !Number.isInteger(parsedSendInterval) ||
      parsedSendInterval < 60
    ) {
      toast.error(t('calibration.errors.sendInterval'));
      return;
    }

    const patch: HiveScaleConfigPatch = {
      send_interval_seconds: parsedSendInterval,
    };
    const hiveScales: NonNullable<HiveScaleConfigPatch['hive_scales']> = [];
    // Hives 1–2 are always sent (as before); hives 3+ only when edited, so
    // opening the page never writes default entries for untouched hives.
    const hivesToSend = hiveOptions
      .map(o => o.index)
      .filter(index => {
        if (index <= 2) return true;
        const draft = drafts[index];
        if (!draft) return false;
        const initial = initialScaleDraft(config, index);
        return (
          draft.offset !== initial.offset || draft.factor !== initial.factor
        );
      });

    for (const index of hivesToSend) {
      const draft = draftFor(index);
      const offset = Number(draft.offset);
      const factor = Number(draft.factor);
      if (
        draft.offset.trim() === '' ||
        !Number.isFinite(offset) ||
        !Number.isInteger(offset)
      ) {
        toast.error(t('calibration.errors.offsetsWhole'));
        return;
      }
      if (draft.factor.trim() === '' || !Number.isFinite(factor) || !factor) {
        toast.error(t('calibration.errors.factorsNonZero'));
        return;
      }
      if (index === 1) {
        patch.scale1_offset = offset;
        patch.scale1_factor = factor;
      } else if (index === 2) {
        patch.scale2_offset = offset;
        patch.scale2_factor = factor;
      } else {
        hiveScales.push({ index, offset, factor });
      }
    }
    if (hiveScales.length) patch.hive_scales = hiveScales;

    updateConfig.mutate(patch, {
      onSuccess: () => toast.success(t('calibration.toasts.configUpdated')),
      onError: error => toast.error(error.message),
    });
  };

  const advancedOption = optionFor(advancedHive);
  const advancedDraft = draftFor(advancedHive);
  const advancedRaw = hiveRaw(latest, advancedHive);

  const setLatestRawAsOffset = () => {
    if (!hasValidRaw(advancedRaw)) {
      toast.error(
        t('calibration.errors.noLatestRaw', {
          scaleName: advancedOption.name,
        }),
      );
      return;
    }
    updateDraft(advancedHive, { offset: String(advancedRaw) });
    toast.success(
      t('calibration.toasts.offsetSet', { scaleName: advancedOption.name }),
    );
  };

  const calculateFactorFromKnownWeight = () => {
    const result = computeFactorFromKnownWeight({
      raw: advancedRaw,
      offset: advancedDraft.offset,
      knownWeightKg: advancedDraft.knownWeightKg,
      scaleName: advancedOption.name,
      t,
    });
    if (result.error !== undefined) {
      toast.error(result.error);
      return;
    }
    updateDraft(advancedHive, { factor: result.factor });
    toast.success(
      t('calibration.toasts.factorCalculated', {
        scaleName: advancedOption.name,
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
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                {hiveOptions.map(option => (
                  <div key={option.index} className="min-w-0">
                    <span className="block truncate font-medium text-foreground">
                      {option.label}
                    </span>
                    {t('calibration.raw', {
                      value: numberOrDash(hiveRaw(latest, option.index), 0),
                    })}
                  </div>
                ))}
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
                    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                      {hiveOptions.map(option => {
                        const isSelected = activeHive === option.index;
                        return (
                          <Button
                            key={option.index}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            className="h-auto justify-start p-3 text-left"
                            onClick={() => setActiveHive(option.index)}
                          >
                            <Weight className="mr-2 h-4 w-4 shrink-0" />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">
                                {option.label}
                              </span>
                              <span className="block text-xs opacity-80">
                                {t('calibration.wizard.latestRaw', {
                                  value: numberOrDash(
                                    hiveRaw(latest, option.index),
                                    0,
                                  ),
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
                              scaleName: activeHiveName,
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
                        <Label htmlFor="hivehub-wizard-known-weight">
                          {t('calibration.wizard.weightKg')}
                        </Label>
                        <Input
                          id="hivehub-wizard-known-weight"
                          type="number"
                          min="0"
                          step="any"
                          value={knownWeightKg}
                          onChange={event => {
                            setKnownWeightKg(event.target.value);
                            setLoadedCapture(null);
                          }}
                          placeholder={t(
                            'calibration.perHive.knownWeightPlaceholder',
                          )}
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
                  <Label htmlFor="hivehub-send-interval">
                    {t('calibration.advanced.sendInterval')}
                  </Label>
                  <Input
                    id="hivehub-send-interval"
                    type="number"
                    min={60}
                    step={1}
                    value={sendInterval}
                    onChange={event => setSendInterval(event.target.value)}
                    disabled={!canConfigure}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hivehub-advanced-hive">
                    {t('calibration.perHive.hiveLabel')}
                  </Label>
                  <HiveSelect
                    id="hivehub-advanced-hive"
                    options={hiveOptions}
                    value={advancedHive}
                    onChange={setAdvancedHive}
                  />
                </div>

                <div className="space-y-3 rounded-md border p-3">
                  <div>
                    <p className="font-medium">
                      {t('calibration.advanced.manualValues', {
                        scaleName: advancedOption.name,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('calibration.advanced.latestRawHint', {
                        value: numberOrDash(advancedRaw, 0),
                      })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hivehub-hive-offset">
                      {t('calibration.advanced.offsetLabel')}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="hivehub-hive-offset"
                        type="number"
                        step={1}
                        value={advancedDraft.offset}
                        onChange={event =>
                          updateDraft(advancedHive, {
                            offset: event.target.value,
                          })
                        }
                        disabled={!canConfigure}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!canConfigure || !hasValidRaw(advancedRaw)}
                        onClick={setLatestRawAsOffset}
                      >
                        {t('calibration.advanced.useLatest')}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hivehub-hive-known-weight">
                      {t('calibration.advanced.knownWeightLabel')}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="hivehub-hive-known-weight"
                        type="number"
                        step="any"
                        value={advancedDraft.knownWeightKg}
                        onChange={event =>
                          updateDraft(advancedHive, {
                            knownWeightKg: event.target.value,
                          })
                        }
                        placeholder={t(
                          'calibration.perHive.knownWeightPlaceholder',
                        )}
                        disabled={!canConfigure}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!canConfigure || !hasValidRaw(advancedRaw)}
                        onClick={calculateFactorFromKnownWeight}
                      >
                        {t('calibration.advanced.calculate')}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hivehub-hive-factor">
                      {t('calibration.advanced.factorLabel')}
                    </Label>
                    <Input
                      id="hivehub-hive-factor"
                      type="number"
                      step="any"
                      value={advancedDraft.factor}
                      onChange={event =>
                        updateDraft(advancedHive, {
                          factor: event.target.value,
                        })
                      }
                      disabled={!canConfigure}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('calibration.perHive.manualSaveHint')}
                  </p>
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

const formatFitNumber = (value: number | null | undefined, digits: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : '—';

export function HiveHubTempCompensationCard({
  device,
  latest,
  hiveNames,
}: Readonly<{
  device: HiveScaleDevice;
  latest: HiveScaleMeasurement | undefined;
  hiveNames: HiveMappingBySlot;
}>) {
  const { t } = useTranslation('hivescale');
  const deviceId = device.device_id;
  const { data: config, isLoading } = useHiveScaleDeviceConfig(deviceId);
  const updateConfig = useUpdateHiveScaleConfig(deviceId);
  const fitTempco = useFitHiveScaleTempCompensation(deviceId);
  const hiveOptions = useHiveOptions(latest, config, hiveNames, t);

  // Load-cell temperature compensation (applied in the HiveHub backend).
  const [tempcoEnabled, setTempcoEnabled] = useState(false);
  const [tempcoSource, setTempcoSource] =
    useState<HiveScaleTempcoSource>('ambient');
  const [tempcoRefTemp, setTempcoRefTemp] = useState('');
  // Only edited coefficients are kept here; the rest read from the config.
  const [coeffDrafts, setCoeffDrafts] = useState<Record<number, string>>({});
  const [selectedHive, setSelectedHive] = useState(1);
  const [lookbackDays, setLookbackDays] = useState(
    String(DEFAULT_FIT_LOOKBACK_DAYS),
  );
  const [setRefTemp, setSetRefTemp] = useState(false);
  const [lastFit, setLastFit] = useState<{
    result: HiveScaleTempCompensationFitResult;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (!config) return;
    setTempcoEnabled(Boolean(config.tempco_enabled));
    setTempcoSource(config.tempco_source ?? 'ambient');
    setTempcoRefTemp(String(config.tempco_ref_temp_c ?? 20));
    setCoeffDrafts({});
  }, [config]);

  useEffect(() => {
    setLastFit(null);
  }, [selectedHive, deviceId]);

  const canConfigure = device.role === 'owner' || device.role === 'admin';
  const selectedOption = hiveOptions.find(o => o.index === selectedHive) ?? {
    index: selectedHive,
    name: t('calibration.perHive.hive', { index: selectedHive }),
    label: t('calibration.perHive.hive', { index: selectedHive }),
  };
  const coeffFor = (index: number) =>
    coeffDrafts[index] ?? String(storedTempco(config, index));

  const saveTempco = () => {
    const parsedRef = Number(tempcoRefTemp);
    if (tempcoRefTemp.trim() === '' || !Number.isFinite(parsedRef)) {
      toast.error(t('calibration.tempco.errors.refTemp'));
      return;
    }

    const parseCoeff = (index: number) => {
      const raw = coeffFor(index);
      const value = Number(raw);
      return raw.trim() === '' || !Number.isFinite(value) ? null : value;
    };

    const scale1 = parseCoeff(1);
    const scale2 = parseCoeff(2);
    // Hives 3+ are sent only when edited, so saving never creates entries.
    const edited = Object.keys(coeffDrafts)
      .map(Number)
      .filter(
        index =>
          index > 2 &&
          coeffDrafts[index] !== String(storedTempco(config, index)),
      );
    const hiveCoeffs = edited.map(index => ({
      index,
      tempco_kg_per_c: parseCoeff(index),
    }));
    if (
      scale1 === null ||
      scale2 === null ||
      hiveCoeffs.some(entry => entry.tempco_kg_per_c === null)
    ) {
      toast.error(t('calibration.tempco.errors.coeff'));
      return;
    }

    const patch: HiveScaleConfigPatch = {
      tempco_enabled: tempcoEnabled,
      tempco_source: tempcoSource,
      tempco_ref_temp_c: parsedRef,
      scale1_tempco_kg_per_c: scale1,
      scale2_tempco_kg_per_c: scale2,
    };
    if (hiveCoeffs.length) {
      patch.hive_scales = hiveCoeffs.map(entry => ({
        index: entry.index,
        tempco_kg_per_c: entry.tempco_kg_per_c as number,
      }));
    }

    updateConfig.mutate(patch, {
      onSuccess: () => toast.success(t('calibration.tempco.toasts.saved')),
      onError: error => toast.error(error.message),
    });
  };

  const runFit = (apply: boolean) => {
    const days = Number(lookbackDays);
    if (!Number.isInteger(days) || days < 1 || days > 90) {
      toast.error(t('calibration.perHive.tempco.errors.lookback'));
      return;
    }
    const { index: scale, name: scaleName } = selectedOption;

    fitTempco.mutate(
      {
        scale,
        lookback_days: days,
        temp_source: tempcoSource,
        calibration_mode_only: false,
        apply,
        set_ref_temp: setRefTemp,
      },
      {
        onSuccess: result => {
          if (!result.ok) {
            setLastFit(null);
            toast.error(
              t('calibration.tempco.toasts.fitFailed', {
                scaleName,
                reason:
                  result.reason ?? t('calibration.tempco.toasts.noSignal'),
              }),
            );
            return;
          }
          setLastFit({ result, name: scaleName });
          const r2 =
            result.r_squared === null ? 'n/a' : result.r_squared.toFixed(2);
          if (apply) {
            toast.success(
              t('calibration.tempco.toasts.fitApplied', {
                scaleName,
                coeff: result.coeff_kg_per_c.toFixed(4),
                refTemp: result.ref_temp_c.toFixed(1),
                r2,
                n: result.n,
              }),
            );
            return;
          }
          // Preview: fill the form for review; nothing is stored until Save.
          setCoeffDrafts(prev => ({
            ...prev,
            [scale]: String(result.coeff_kg_per_c),
          }));
          setTempcoEnabled(true);
          if (result.temp_source) setTempcoSource(result.temp_source);
          if (setRefTemp) setTempcoRefTemp(String(result.ref_temp_c));
          toast.success(
            t('calibration.perHive.tempco.toasts.fitFilled', {
              scaleName,
              coeff: result.coeff_kg_per_c.toFixed(4),
              r2,
              n: result.n,
            }),
          );
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const fitSummary = lastFit
    ? t('calibration.perHive.tempco.fitSummary', {
        scaleName: lastFit.name,
        coeff: formatFitNumber(lastFit.result.coeff_kg_per_c, 5),
        r2: formatFitNumber(lastFit.result.r_squared, 3),
        n: lastFit.result.n,
        min: formatFitNumber(lastFit.result.temp_min_c, 1),
        max: formatFitNumber(lastFit.result.temp_max_c, 1),
        mean: formatFitNumber(lastFit.result.ref_temp_c, 2),
      })
    : null;
  const lowRSquared =
    lastFit !== null &&
    lastFit.result.r_squared !== null &&
    lastFit.result.r_squared < LOW_R_SQUARED;

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
              <Label htmlFor="hivehub-tempco-enabled">
                {t('calibration.tempco.enableAria')}
              </Label>
              <Switch
                id="hivehub-tempco-enabled"
                checked={tempcoEnabled}
                onCheckedChange={setTempcoEnabled}
                disabled={!canConfigure}
                aria-label={t('calibration.tempco.enableAria')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hivehub-tempco-source">
                {t('calibration.tempco.sourceLabel')}
              </Label>
              <Select
                value={tempcoSource}
                onValueChange={value =>
                  setTempcoSource(value as HiveScaleTempcoSource)
                }
                disabled={!canConfigure}
              >
                <SelectTrigger id="hivehub-tempco-source" className="w-full">
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
              <Label htmlFor="hivehub-tempco-ref">
                {t('calibration.tempco.refLabel')}
              </Label>
              <Input
                id="hivehub-tempco-ref"
                type="number"
                step="any"
                value={tempcoRefTemp}
                onChange={event => setTempcoRefTemp(event.target.value)}
                disabled={!canConfigure}
              />
              <p className="text-xs text-muted-foreground">
                {t('calibration.perHive.tempco.refHint')}
              </p>
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <div className="space-y-2">
                <Label htmlFor="hivehub-tempco-hive">
                  {t('calibration.perHive.hiveLabel')}
                </Label>
                <HiveSelect
                  id="hivehub-tempco-hive"
                  options={hiveOptions}
                  value={selectedHive}
                  onChange={setSelectedHive}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hivehub-tempco-coeff">
                  {t('calibration.tempco.coeffLabel', {
                    scaleName: selectedOption.name,
                  })}
                </Label>
                <Input
                  id="hivehub-tempco-coeff"
                  type="number"
                  step="any"
                  value={coeffFor(selectedHive)}
                  onChange={event =>
                    setCoeffDrafts(prev => ({
                      ...prev,
                      [selectedHive]: event.target.value,
                    }))
                  }
                  disabled={!canConfigure}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hivehub-tempco-lookback">
                  {t('calibration.perHive.tempco.lookbackLabel')}
                </Label>
                <Input
                  id="hivehub-tempco-lookback"
                  type="number"
                  min={1}
                  max={90}
                  step={1}
                  value={lookbackDays}
                  onChange={event => setLookbackDays(event.target.value)}
                  disabled={!canConfigure}
                />
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="hivehub-tempco-set-ref"
                  checked={setRefTemp}
                  onCheckedChange={checked => setSetRefTemp(checked === true)}
                  disabled={!canConfigure}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <Label htmlFor="hivehub-tempco-set-ref">
                    {t('calibration.perHive.tempco.setRefTemp')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('calibration.perHive.tempco.setRefTempHint')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => runFit(false)}
                  disabled={!canConfigure || fitTempco.isPending}
                >
                  {fitTempco.isPending
                    ? t('calibration.tempco.fitting')
                    : t('calibration.perHive.tempco.fitOnly')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => runFit(true)}
                  disabled={!canConfigure || fitTempco.isPending}
                >
                  {fitTempco.isPending
                    ? t('calibration.tempco.fitting')
                    : t('calibration.perHive.tempco.fitAndApply')}
                </Button>
              </div>

              {fitSummary && (
                <p className="text-xs text-muted-foreground">{fitSummary}</p>
              )}
              {lowRSquared && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {t('calibration.perHive.tempco.lowRSquared')}
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {t('calibration.perHive.tempco.autoFitHint')}
            </p>

            {!canConfigure && (
              <p className="text-xs text-muted-foreground">
                {t('calibration.viewerNotice')}
              </p>
            )}

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
