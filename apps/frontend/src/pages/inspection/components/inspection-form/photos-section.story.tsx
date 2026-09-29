import { useState } from 'react';
import { Toaster } from 'sonner';
import { PhotosSection, PendingPhoto } from './photos-section';

/**
 * Photo section of an inspection that already exists, so picking a file uploads
 * it right away. Rendered with a Toaster so the component test can assert on
 * the feedback the user gets.
 */
export const PhotosForExistingInspection = () => {
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  return (
    <div style={{ width: 640, padding: 16 }}>
      <PhotosSection
        inspectionId="11111111-1111-1111-1111-111111111111"
        pendingPhotos={pending}
        onPendingPhotosChange={setPending}
      />
      <Toaster />
    </div>
  );
};

/** Same section on an inspection that has not been saved yet. */
export const PhotosForNewInspection = () => {
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  return (
    <div style={{ width: 640, padding: 16 }}>
      <PhotosSection pendingPhotos={pending} onPendingPhotosChange={setPending} />
      <Toaster />
    </div>
  );
};
