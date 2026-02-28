import { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { apiClient } from '@/api/client';

export function PhotoGallery({
  quickCheckId,
  photos,
}: {
  quickCheckId: string;
  photos: Array<{ id: string; fileName: string }>;
}) {
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    id: string;
    fileName: string;
  } | null>(null);

  useEffect(() => {
    photos.forEach(photo => {
      apiClient
        .get<{ downloadUrl: string }>(
          `/api/quick-checks/${quickCheckId}/photos/${photo.id}/download-url`,
        )
        .then(res =>
          setPhotoUrls(prev => ({
            ...prev,
            [photo.id]: res.data.downloadUrl,
          })),
        )
        .catch(() => {});
    });
  }, [quickCheckId, photos]);

  return (
    <>
      <div className="group/photos relative inline-flex">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setLightboxPhoto(photos[0])}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span>
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </span>
        </button>
        <div className="hidden group-hover/photos:flex absolute bottom-full left-0 mb-1 gap-1.5 p-1.5 bg-popover border rounded-md shadow-md z-50">
          {photos.map(photo => (
            <button
              key={photo.id}
              type="button"
              className="w-16 h-16 rounded overflow-hidden border hover:ring-2 ring-primary transition-shadow shrink-0"
              onClick={e => {
                e.stopPropagation();
                setLightboxPhoto(photo);
              }}
            >
              {photoUrls[photo.id] ? (
                <img
                  src={photoUrls[photo.id]}
                  alt={photo.fileName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      <Dialog
        open={!!lightboxPhoto}
        onOpenChange={open => !open && setLightboxPhoto(null)}
      >
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Photo</DialogTitle>
          </DialogHeader>
          {lightboxPhoto && photoUrls[lightboxPhoto.id] && (
            <img
              src={photoUrls[lightboxPhoto.id]}
              alt={lightboxPhoto.fileName}
              className="w-full h-auto rounded"
            />
          )}
          {photos.length > 1 && lightboxPhoto && (
            <div className="flex gap-2 justify-center mt-2">
              {photos.map(photo => (
                <button
                  key={photo.id}
                  type="button"
                  className={cn(
                    'w-12 h-12 rounded overflow-hidden border-2 transition-colors',
                    photo.id === lightboxPhoto.id
                      ? 'border-primary'
                      : 'border-transparent hover:border-muted-foreground',
                  )}
                  onClick={() => setLightboxPhoto(photo)}
                >
                  {photoUrls[photo.id] ? (
                    <img
                      src={photoUrls[photo.id]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
