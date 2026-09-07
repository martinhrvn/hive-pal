import { isAxiosError } from 'axios';
import { apiClient } from '@/api/client';

interface PendingPhoto {
  id: string;
  file: File;
  previewUrl: string;
  caption?: string;
}

export interface FailedPhotoUpload {
  fileName: string;
  message: string;
}

export interface PendingPhotoUploadResult {
  uploaded: number;
  failed: FailedPhotoUpload[];
}

function failureMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const apiMessage = (error.response?.data as { message?: unknown } | undefined)
      ?.message;
    if (typeof apiMessage === 'string' && apiMessage.length > 0) {
      return apiMessage;
    }
    if (error.response?.status) return `HTTP ${error.response.status}`;
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * Uploads the photos picked while the inspection did not exist yet, once it has
 * been created.
 *
 * One failing photo must not stop the others, so failures are collected and
 * returned instead of thrown — the caller is expected to tell the user about
 * them. Reporting matters here: the inspection itself saves fine, so silently
 * dropping a photo looks to the beekeeper as if it had been stored.
 */
export async function uploadPendingPhotos(
  inspectionId: string,
  pendingPhotos: PendingPhoto[],
  onProgress?: (completed: number, total: number) => void,
): Promise<PendingPhotoUploadResult> {
  const total = pendingPhotos.length;
  const failed: FailedPhotoUpload[] = [];
  let completed = 0;

  for (const photo of pendingPhotos) {
    try {
      const formData = new FormData();
      formData.append('file', photo.file, photo.file.name);
      formData.append('fileName', photo.file.name);
      if (photo.caption) {
        formData.append('caption', photo.caption);
      }

      await apiClient.post(`/api/inspections/${inspectionId}/photos`, formData);

      completed++;
      onProgress?.(completed, total);
    } catch (error) {
      console.error('Failed to upload photo:', photo.file.name, error);
      failed.push({
        fileName: photo.file.name,
        message: failureMessage(error),
      });
    }
  }

  return { uploaded: completed, failed };
}
