import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Mic, Square, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useHive, useCreateInspection } from '@/api/hooks';
import { useAudioRecorder } from '@/components/audio/useAudioRecorder';
import { apiClient } from '@/api/client';
import { InspectionStatus } from 'shared-schemas';
import { toInspectionDateISOString } from '@/utils/inspection-date';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

type Phase = 'idle' | 'starting' | 'recording' | 'uploading';

export function AudioQuickPage() {
  const { hiveId } = useParams<{ hiveId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('inspection');
  const { data: hive, isLoading: isHiveLoading } = useHive(hiveId ?? '', {
    enabled: !!hiveId,
  });

  const {
    isRecording,
    duration,
    audioBlob,
    error,
    isSupported,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const { mutateAsync: createInspection } = useCreateInspection();

  const [phase, setPhase] = useState<Phase>('idle');
  // Inspection id is created after mic access is granted, so a denied
  // permission never leaves an orphan empty inspection behind.
  const inspectionIdRef = useRef<string | null>(null);

  const handleStart = useCallback(() => {
    if (!hiveId) return;
    setPhase('starting');
    // useAudioRecorder swallows its own errors into the `error` state instead
    // of throwing, so we wait for isRecording (or error) to flip and create
    // the inspection from an effect below.
    void startRecording();
  }, [hiveId, startRecording]);

  // Once the recorder is actually capturing, persist a minimal inspection so
  // we have somewhere to attach the audio when the user stops.
  useEffect(() => {
    if (phase !== 'starting') return;
    if (error) {
      setPhase('idle');
      return;
    }
    if (!isRecording || !hiveId) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await createInspection({
          hiveId,
          date: toInspectionDateISOString(new Date(), false),
          isAllDay: false,
          status: InspectionStatus.COMPLETED,
          observations: {},
          actions: [],
        });
        if (cancelled) return;
        inspectionIdRef.current = res.id;
        setPhase('recording');
      } catch (err) {
        console.error('Failed to create inspection for audio recording', err);
        toast.error(t('inspection:audioQuick.uploadFailed'));
        await stopRecording();
        setPhase('idle');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, error, isRecording, hiveId, createInspection, stopRecording, t]);

  const handleStop = useCallback(async () => {
    await stopRecording();
  }, [stopRecording]);

  // When the recorder finalizes the blob, upload it and navigate.
  useEffect(() => {
    if (phase !== 'recording' || !audioBlob || isRecording) return;
    const id = inspectionIdRef.current;
    if (!id) return;

    const upload = async () => {
      setPhase('uploading');
      try {
        const fileName = `recording-${Date.now()}.${
          audioBlob.type.includes('webm') ? 'webm' : 'mp3'
        }`;
        const formData = new FormData();
        formData.append('file', audioBlob, fileName);
        formData.append('fileName', fileName);
        formData.append('duration', duration.toString());
        await apiClient.post(`/api/inspections/${id}/audio`, formData);
        navigate(`/inspections/${id}`);
      } catch (err) {
        console.error('Failed to upload audio', err);
        toast.error(t('inspection:audioQuick.uploadFailed'));
        // The inspection exists, so let the user see it and retry from there.
        navigate(`/inspections/${id}`);
      }
    };

    void upload();
  }, [phase, audioBlob, isRecording, duration, navigate, t]);

  const handleClose = () => {
    if (hiveId) navigate(`/hives/${hiveId}`);
    else navigate('/inspections');
  };

  if (isHiveLoading || !hive) {
    return (
      <div className="flex h-dvh w-dvw items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh w-dvw flex-col overflow-hidden bg-background">
      {/* Ambient backdrop. Warm wash at rest; cool red wash while recording. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 -z-10 transition-colors duration-700 ${
          phase === 'recording'
            ? 'bg-[radial-gradient(ellipse_at_center,oklch(0.92_0.08_25)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,oklch(0.30_0.10_25)_0%,transparent_70%)]'
            : 'bg-[radial-gradient(ellipse_at_center,oklch(0.96_0.05_85)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,oklch(0.24_0.05_85)_0%,transparent_70%)]'
        }`}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-[max(env(safe-area-inset-top),0.875rem)] pb-3">
        <div className="min-w-0 flex-1">
          <div className="font-overline text-muted-foreground">
            {t('inspection:audioQuick.recordingFor')}
          </div>
          <div className="font-display mt-0.5 truncate text-2xl leading-tight">
            {hive.name}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClose}
          disabled={phase === 'uploading'}
          aria-label="Close"
          className="size-9 rounded-full text-muted-foreground"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-5">
        {!isSupported ? (
          <p className="text-center text-muted-foreground">
            {t('inspection:audioQuick.unsupported')}
          </p>
        ) : error ? (
          <div className="flex max-w-xs flex-col items-center gap-4 text-center">
            <p className="text-destructive">{error}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetRecording();
                setPhase('idle');
              }}
              className="rounded-full"
            >
              {t('inspection:audioQuick.tryAgain')}
            </Button>
          </div>
        ) : phase === 'idle' || phase === 'starting' ? (
          <>
            <p className="max-w-xs text-center text-sm leading-relaxed text-muted-foreground">
              {t('inspection:audioQuick.prompt')}
            </p>
            <div className="relative flex items-center justify-center">
              {/* Soft halo behind the button */}
              <div
                aria-hidden
                className="absolute size-56 rounded-full bg-[oklch(0.78_0.16_82)]/15 blur-xl"
              />
              <button
                type="button"
                onClick={handleStart}
                disabled={phase === 'starting'}
                className="relative flex size-44 items-center justify-center rounded-full bg-foreground text-background shadow-2xl shadow-foreground/20 ring-8 ring-[oklch(0.78_0.16_82)]/20 transition-all duration-200 active:scale-95 disabled:opacity-60"
                aria-label={t('inspection:audioQuick.start')}
              >
                {phase === 'starting' ? (
                  <Loader2 className="size-12 animate-spin" />
                ) : (
                  <Mic className="size-14" strokeWidth={1.6} />
                )}
              </button>
            </div>
            <div className="font-overline text-foreground">
              {phase === 'starting'
                ? t('inspection:audioQuick.starting')
                : t('inspection:audioQuick.tapToStart')}
            </div>
          </>
        ) : phase === 'recording' ? (
          <>
            <div className="flex items-center gap-3">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-70" />
                <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
              </span>
              <span className="font-display text-5xl tabular-nums">
                {formatDuration(duration)}
              </span>
            </div>
            <div className="relative flex items-center justify-center">
              {/* Concentric pulsing rings */}
              <span
                aria-hidden
                className="absolute size-56 animate-ping rounded-full border border-destructive/30"
                style={{ animationDuration: '2.4s' }}
              />
              <span
                aria-hidden
                className="absolute size-48 animate-ping rounded-full border border-destructive/40"
                style={{ animationDuration: '2s', animationDelay: '0.4s' }}
              />
              <button
                type="button"
                onClick={handleStop}
                className="relative flex size-40 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-2xl shadow-destructive/30 transition-transform active:scale-95"
                aria-label={t('inspection:audioQuick.stop')}
              >
                <Square className="size-12" fill="currentColor" />
              </button>
            </div>
            <div className="font-overline text-muted-foreground">
              {t('inspection:audioQuick.tapToStop')}
            </div>
          </>
        ) : (
          /* uploading */
          <div className="flex flex-col items-center gap-5">
            <div className="relative flex size-20 items-center justify-center">
              <span
                aria-hidden
                className="absolute inset-0 animate-ping rounded-full border-2 border-[oklch(0.78_0.16_82)]/50"
              />
              <Loader2 className="size-10 animate-spin text-foreground" />
            </div>
            <div className="font-overline text-muted-foreground">
              {t('inspection:audioQuick.uploading')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
