import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/api/client';

interface StandalonePhotoPreviewProps {
  photoId: string;
  fileName: string;
  caption?: string | null;
}

export function StandalonePhotoPreview({
  photoId,
  fileName,
  caption,
}: StandalonePhotoPreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ downloadUrl: string }>(`/api/photos/${photoId}/download-url`)
      .then(res => setUrl(res.data.downloadUrl))
      .catch(() => {});
  }, [photoId]);

  if (!url) {
    return <div className="w-20 h-20 rounded-md bg-muted animate-pulse mt-1" />;
  }

  return (
    <>
      <button
        type="button"
        className="mt-1 w-20 h-20 rounded-md overflow-hidden border hover:ring-2 ring-primary transition-shadow"
        onClick={e => {
          e.stopPropagation();
          setLightboxOpen(true);
        }}
      >
        <img
          src={url}
          alt={caption || fileName}
          className="w-full h-full object-cover"
        />
      </button>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>{caption || fileName}</DialogTitle>
          </DialogHeader>
          <img
            src={url}
            alt={caption || fileName}
            className="w-full h-auto rounded"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
