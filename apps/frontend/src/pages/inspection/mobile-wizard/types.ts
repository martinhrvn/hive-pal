export interface PendingRecording {
  id: string;
  blob: Blob;
  duration: number;
  fileName: string;
}

export interface PendingPhoto {
  id: string;
  file: File;
  previewUrl: string;
}
