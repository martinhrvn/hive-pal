import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Loader2, Info, X, ImagePlus } from 'lucide-react';
import {
  useInspectionPhotos,
  useUploadInspectionPhoto,
  useDeleteInspectionPhoto,
  getInspectionPhotoDownloadUrl,
} from '@/api/hooks/usePhotos';
import { useFeatures } from '@/api/hooks/useFeatures';
import { Button } from '@/components/ui/button';

const MAX_PHOTOS = 5;
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/heic';

export interface PendingPhoto {
  id: string;
  file: File;
  previewUrl: string;
  caption?: string;
}

interface PhotosSectionProps {
  inspectionId?: string;
  onPendingPhotosChange?: (photos: PendingPhoto[]) => void;
  pendingPhotos?: PendingPhoto[];
}

export function PhotosSection({
  inspectionId,
  onPendingPhotosChange,
  pendingPhotos = [],
}: PhotosSectionProps) {
  const { t } = useTranslation('inspection');
  const isNewInspection = !inspectionId;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { data: features } = useFeatures();

  const { data: existingPhotos = [], isLoading } = useInspectionPhotos(
    inspectionId,
    { enabled: !!inspectionId },
  );
  const { mutateAsync: uploadPhoto, isPending: isUploading } =
    useUploadInspectionPhoto(inspectionId || '');
  const deletePhoto = useDeleteInspectionPhoto(inspectionId || '');

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      pendingPhotos.forEach(p => URL.revokeObjectURL(p.previewUrl));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCount = existingPhotos.length + pendingPhotos.length;
  const canAddMore = totalCount < MAX_PHOTOS;

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      // Reset input so the same file can be re-selected
      e.target.value = '';

      const remaining = MAX_PHOTOS - totalCount;
      const filesToAdd = files.slice(0, remaining);

      if (isNewInspection) {
        const newPending: PendingPhoto[] = filesToAdd.map(file => ({
          id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          previewUrl: URL.createObjectURL(file),
        }));
        onPendingPhotosChange?.([...pendingPhotos, ...newPending]);
      } else {
        for (const file of filesToAdd) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('fileName', file.name);
          await uploadPhoto(formData);
        }
      }
    },
    [
      isNewInspection,
      totalCount,
      onPendingPhotosChange,
      pendingPhotos,
      uploadPhoto,
    ],
  );

  const handleDelete = useCallback(
    async (photoId: string) => {
      if (photoId.startsWith('pending-')) {
        const photo = pendingPhotos.find(p => p.id === photoId);
        if (photo) URL.revokeObjectURL(photo.previewUrl);
        onPendingPhotosChange?.(pendingPhotos.filter(p => p.id !== photoId));
      } else {
        await deletePhoto.mutateAsync(photoId);
      }
    },
    [onPendingPhotosChange, pendingPhotos, deletePhoto],
  );

  if (features && !features.storageEnabled) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="size-5" />
        <h3 className="font-medium">{t('inspection:form.photos.title')}</h3>
        {pendingPhotos.length > 0 && (
          <span className="text-xs text-muted-foreground">
            ({t('inspection:form.photos.pendingUpload', { count: pendingPhotos.length })})
          </span>
        )}
      </div>

      {/* Photo grid */}
      {(existingPhotos.length > 0 || pendingPhotos.length > 0) && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {existingPhotos.map(photo => (
            <ExistingPhotoThumbnail
              key={photo.id}
              photoId={photo.id}
              inspectionId={inspectionId!}
              fileName={photo.fileName}
              onDelete={() => handleDelete(photo.id)}
            />
          ))}
          {pendingPhotos.map(photo => (
            <div key={photo.id} className="group relative aspect-square">
              <img
                src={photo.previewUrl}
                alt={photo.file.name}
                className="size-full rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Warning for pending photos on new inspection */}
      {isNewInspection && pendingPhotos.length > 0 && (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>{t('inspection:form.photos.uploadWarning')}</span>
        </div>
      )}

      {/* Add photo buttons */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      {canAddMore ? (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 border-dashed"
          >
            {isUploading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Camera className="mr-2 size-4" />
            )}
            {t('inspection:form.photos.takePhoto')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 border-dashed"
          >
            <ImagePlus className="mr-2 size-4" />
            {t('inspection:form.photos.addPhoto')}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t('inspection:form.photos.maxReached', { max: MAX_PHOTOS })}
        </p>
      )}
    </div>
  );
}

function ExistingPhotoThumbnail({
  photoId,
  inspectionId,
  fileName,
  onDelete,
}: {
  photoId: string;
  inspectionId: string;
  fileName: string;
  onDelete: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    getInspectionPhotoDownloadUrl(inspectionId, photoId).then(setUrl);
  }, [inspectionId, photoId]);

  return (
    <div className="group relative aspect-square">
      {url ? (
        <img
          src={url}
          alt={fileName}
          className="size-full rounded-md object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center rounded-md bg-muted">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
