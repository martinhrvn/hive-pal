import { Mic, Square, Pause, Play, X, Upload, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAudioRecorder } from './useAudioRecorder';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onCancel?: () => void;
  disabled?: boolean;
  isUploading?: boolean;
  className?: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioRecorder({
  onRecordingComplete,
  onCancel,
  disabled = false,
  isUploading = false,
  className,
}: AudioRecorderProps) {
  const { t } = useTranslation('common');
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    error,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useAudioRecorder();

  const handleSave = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, duration);
      resetRecording();
    }
  };

  const handleCancel = () => {
    resetRecording();
    onCancel?.();
  };

  if (!isSupported) {
    return (
      <div className={cn('p-4 bg-muted rounded-lg text-center', className)}>
        <p className="text-muted-foreground text-sm">
          {t('audioRecorder.notSupported')}
        </p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={cn('p-4 bg-destructive/10 rounded-lg', className)}>
        <p className="text-destructive text-sm mb-2">{error}</p>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={resetRecording}
        >
          {t('actions.tryAgain')}
        </Button>
      </div>
    );
  }

  // Show preview state (after recording)
  if (audioBlob && audioUrl) {
    return (
      <div className={cn('p-4 bg-muted rounded-lg space-y-3', className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {t('audioRecorder.preview')}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatDuration(duration)}
          </span>
        </div>

        <audio src={audioUrl} controls className="w-full h-10" />

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleCancel}
            disabled={isUploading}
            className="flex-1"
          >
            <X className="size-4" />
            {t('audioRecorder.discard')}
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={handleSave}
            disabled={isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {isUploading ? t('photo.uploading') : t('audioRecorder.save')}
          </Button>
        </div>
      </div>
    );
  }

  // Show recording state
  if (isRecording) {
    return (
      <div className={cn('p-4 bg-muted rounded-lg space-y-3', className)}>
        <div className="flex items-center justify-center gap-3">
          <div
            className={cn(
              'size-3 rounded-full',
              isPaused ? 'bg-amber-500' : 'bg-red-500 animate-pulse',
            )}
          />
          <span className="text-2xl font-mono font-bold tabular-nums">
            {formatDuration(duration)}
          </span>
        </div>

        <div className="flex justify-center gap-2">
          {isPaused ? (
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={resumeRecording}
            >
              <Play className="size-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={pauseRecording}
            >
              <Pause className="size-4" />
            </Button>
          )}
          <Button
            variant="destructive"
            size="icon"
            type="button"
            onClick={stopRecording}
            className="size-12"
          >
            <Square className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={handleCancel}
          >
            <X className="size-4" />
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {isPaused ? t('audioRecorder.paused') : t('audioRecorder.recording')}
        </p>
      </div>
    );
  }

  // Show idle state
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <Button
        variant="outline"
        size="lg"
        type="button"
        onClick={startRecording}
        disabled={disabled}
        className="gap-2"
      >
        <Mic className="size-5" />
        {t('audioRecorder.start')}
      </Button>
      <p className="text-xs text-muted-foreground">{t('audioRecorder.hint')}</p>
    </div>
  );
}
