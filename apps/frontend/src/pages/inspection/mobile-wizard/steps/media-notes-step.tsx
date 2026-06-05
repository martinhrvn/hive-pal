import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Mic, X } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AudioRecorder } from '@/components/audio';
import { StepHeader } from '../step-header';
import type { PendingPhoto, PendingRecording } from '../types';
import type { InspectionFormData } from '@/pages/inspection/components/inspection-form/schema';

const MAX_PHOTOS = 5;
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/heic';

interface MediaNotesStepProps {
  pendingPhotos: PendingPhoto[];
  onPendingPhotosChange: (photos: PendingPhoto[]) => void;
  pendingRecordings: PendingRecording[];
  onPendingRecordingsChange: (recordings: PendingRecording[]) => void;
}

export function MediaNotesStep({
  pendingPhotos,
  onPendingPhotosChange,
  pendingRecordings,
  onPendingRecordingsChange,
}: MediaNotesStepProps) {
  const { t } = useTranslation('inspection');
  const { control } = useFormContext<InspectionFormData>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      pendingPhotos.forEach(p => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRecordingComplete = useCallback(
    (blob: Blob, duration: number) => {
      const fileName = `recording-${Date.now()}.${
        blob.type.includes('webm') ? 'webm' : 'mp3'
      }`;
      onPendingRecordingsChange([
        ...pendingRecordings,
        { id: `pending-${Date.now()}`, blob, duration, fileName },
      ]);
    },
    [pendingRecordings, onPendingRecordingsChange],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    const remaining = MAX_PHOTOS - pendingPhotos.length;
    const toAdd = files.slice(0, remaining).map(file => ({
      id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    onPendingPhotosChange([...pendingPhotos, ...toAdd]);
  };

  const removePhoto = (id: string) => {
    const photo = pendingPhotos.find(p => p.id === id);
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    onPendingPhotosChange(pendingPhotos.filter(p => p.id !== id));
  };

  const removeRecording = (id: string) => {
    onPendingRecordingsChange(pendingRecordings.filter(r => r.id !== id));
  };

  const canAddMore = pendingPhotos.length < MAX_PHOTOS;

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto pb-2">
      <StepHeader
        title={t('inspection:mobile.mediaNotes.title')}
        hint={t('inspection:mobile.mediaNotes.hint')}
      />

      <section className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Mic className="size-3.5 text-muted-foreground" />
          <span className="font-overline text-muted-foreground">Audio</span>
        </div>
        <AudioRecorder onRecordingComplete={handleRecordingComplete} />

        {pendingRecordings.length > 0 && (
          <ul className="space-y-1.5 pt-1">
            {pendingRecordings.map((r, i) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[oklch(0.78_0.16_82)]" />
                  <span className="font-medium">
                    {t('inspection:mobile.mediaNotes.recordingNumber', { n: i + 1 })}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {Math.floor(r.duration / 60)}:
                    {(r.duration % 60).toString().padStart(2, '0')}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRecording(r.id)}
                  aria-label={t('inspection:mobile.mediaNotes.removeRecording')}
                  className="size-7 rounded-full text-muted-foreground"
                >
                  <X className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Camera className="size-3.5 text-muted-foreground" />
          <span className="font-overline text-muted-foreground">
            Photos {pendingPhotos.length > 0 && `· ${pendingPhotos.length}/${MAX_PHOTOS}`}
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          capture="environment"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canAddMore}
          className="h-12 w-full rounded-xl border-dashed text-sm font-medium"
        >
          <Camera className="mr-2 size-4" />
          {canAddMore
            ? t('inspection:mobile.mediaNotes.addPhoto')
            : t('inspection:form.photos.maxReached', { max: MAX_PHOTOS })}
        </Button>

        {pendingPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {pendingPhotos.map(p => (
              <div
                key={p.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border"
              >
                <img
                  src={p.previewUrl}
                  alt=""
                  className="size-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-foreground/70 text-background backdrop-blur-sm"
                  aria-label={t('inspection:mobile.mediaNotes.removePhoto')}
                >
                  <X className="size-3" strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="font-overline text-muted-foreground">
          {t('inspection:notesCard.title')}
        </div>
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <Textarea
              value={field.value ?? ''}
              onChange={field.onChange}
              placeholder={t('inspection:mobile.mediaNotes.notesPlaceholder')}
              className="min-h-28 resize-none rounded-xl text-base leading-relaxed"
            />
          )}
        />
      </section>
    </div>
  );
}
