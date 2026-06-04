import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, RefreshCw, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreatePhoto, useDeletePhoto } from '@/api/hooks';
import { useTranslation } from 'react-i18next';

export interface FeaturePhotoPickerRef {
  getPendingFile: () => File | null;
  clearPendingFile: () => void;
}

interface FeaturePhotoPickerProps {
  apiaryId?: string;
  hiveId?: string;
  currentPhotoUrl?: string | null;
  currentPhotoId?: string | null;
  onPhotoUploaded: (photoId: string) => void;
  onPhotoRemoved: () => void;
}

export const FeaturePhotoPicker = forwardRef<
  FeaturePhotoPickerRef,
  FeaturePhotoPickerProps
>(function FeaturePhotoPicker(
  {
    apiaryId,
    hiveId,
    currentPhotoUrl,
    currentPhotoId,
    onPhotoUploaded,
    onPhotoRemoved,
  },
  ref,
) {
  const { t } = useTranslation('common');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [cleared, setCleared] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPhoto = useCreatePhoto();
  const deletePhoto = useDeletePhoto();

  useImperativeHandle(ref, () => ({
    getPendingFile: () => pendingFile,
    clearPendingFile: () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPendingFile(null);
    },
  }));

  const displayUrl = previewUrl ?? (cleared ? null : currentPhotoUrl);
  const isBusy = createPhoto.isPending || deletePhoto.isPending;

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!apiaryId) return null;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('apiaryId', apiaryId);
    if (hiveId) formData.append('hiveId', hiveId);
    formData.append('caption', 'Feature photo');
    formData.append('date', new Date().toISOString());
    const result = await createPhoto.mutateAsync(formData);
    return result.id;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    const previousPhotoId = !cleared ? currentPhotoId : null;
    const previousPreview = previewUrl;
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setCleared(false);

    if (apiaryId) {
      try {
        const newId = await uploadFile(file);
        if (newId) {
          onPhotoUploaded(newId);
          if (previousPhotoId && previousPhotoId !== newId) {
            try {
              await deletePhoto.mutateAsync(previousPhotoId);
            } catch {
              // Best effort — leaving an orphan is better than blocking the UX.
            }
          }
        }
        setPendingFile(null);
        if (previousPreview) URL.revokeObjectURL(previousPreview);
      } catch {
        toast.error(
          t('photo.uploadFailed', { defaultValue: 'Failed to upload photo' }),
        );
        URL.revokeObjectURL(localPreview);
        setPreviewUrl(previousPreview);
      }
    } else {
      setPendingFile(file);
      if (previousPreview) URL.revokeObjectURL(previousPreview);
    }
  };

  const handleRemove = async () => {
    const remoteIdToDelete = !previewUrl && !cleared ? currentPhotoId : null;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPendingFile(null);

    if (remoteIdToDelete) {
      try {
        await deletePhoto.mutateAsync(remoteIdToDelete);
      } catch {
        toast.error(
          t('photo.deleteFailed', { defaultValue: 'Failed to delete photo' }),
        );
        return;
      }
    }

    setCleared(true);
    onPhotoRemoved();
  };

  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {t('photo.featurePhoto', { defaultValue: 'Feature Photo' })}{' '}
        <span className="text-muted-foreground font-normal">
          ({t('photo.optional', { defaultValue: 'optional' })})
        </span>
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileChange}
        className="hidden"
      />

      {displayUrl ? (
        <div className="relative group">
          <img
            src={displayUrl}
            alt="Feature photo"
            className="w-full h-40 object-cover rounded-md border"
          />
          {isBusy ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          ) : (
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={openFilePicker}
                aria-label={t('photo.replace', { defaultValue: 'Replace' })}
                title={t('photo.replace', { defaultValue: 'Replace' })}
                className="bg-black/60 text-white rounded-full p-1"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                aria-label={t('actions.remove', { defaultValue: 'Remove' })}
                title={t('actions.remove', { defaultValue: 'Remove' })}
                className="bg-black/60 text-white rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-24 border-dashed"
          onClick={openFilePicker}
          disabled={isBusy}
        >
          <div className="flex flex-col items-center gap-1">
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {t('photo.selectPhoto', { defaultValue: 'Select a photo' })}
            </span>
          </div>
        </Button>
      )}
    </div>
  );
});
