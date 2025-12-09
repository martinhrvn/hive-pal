import { useState, useCallback } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { AudioRecorder, AudioRecordingsList } from '@/components/audio';
import {
  useInspectionAudio,
  useUploadInspectionAudio,
  useDeleteInspectionAudio,
  getAudioDownloadUrl,
} from '@/api/hooks/useInspectionAudio';
import { AudioResponse } from 'shared-schemas';

interface PendingRecording {
  id: string;
  blob: Blob;
  duration: number;
  fileName: string;
}

interface AudioSectionProps {
  inspectionId?: string;
  // For new inspections, we need to collect pending recordings
  onPendingRecordingsChange?: (recordings: PendingRecording[]) => void;
  pendingRecordings?: PendingRecording[];
}

export function AudioSection({
  inspectionId,
  onPendingRecordingsChange,
  pendingRecordings = [],
}: AudioSectionProps) {
  const isNewInspection = !inspectionId;
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Hooks for existing inspections
  const { data: existingRecordings = [], isLoading } = useInspectionAudio(
    inspectionId || '',
    { enabled: !!inspectionId }
  );
  const { upload, isUploading } = useUploadInspectionAudio(inspectionId || '');
  const deleteAudio = useDeleteInspectionAudio(inspectionId || '');

  // Handle recording complete
  const handleRecordingComplete = useCallback(
    async (blob: Blob, duration: number) => {
      const fileName = `recording-${Date.now()}.${blob.type.includes('webm') ? 'webm' : 'mp3'}`;

      if (isNewInspection) {
        // For new inspections, store locally
        const newRecording: PendingRecording = {
          id: `pending-${Date.now()}`,
          blob,
          duration,
          fileName,
        };
        onPendingRecordingsChange?.([...pendingRecordings, newRecording]);
      } else {
        // For existing inspections, upload immediately
        await upload(blob, fileName, duration);
      }
    },
    [isNewInspection, onPendingRecordingsChange, pendingRecordings, upload]
  );

  // Handle delete
  const handleDelete = useCallback(
    async (audioId: string) => {
      if (audioId.startsWith('pending-')) {
        // Remove from pending recordings
        onPendingRecordingsChange?.(
          pendingRecordings.filter((r) => r.id !== audioId)
        );
      } else {
        // Delete from server
        setDeletingId(audioId);
        try {
          await deleteAudio.mutateAsync(audioId);
        } finally {
          setDeletingId(null);
        }
      }
    },
    [onPendingRecordingsChange, pendingRecordings, deleteAudio]
  );

  // Get download URL for existing recordings
  const getDownloadUrl = useCallback(
    async (audioId: string) => {
      if (!inspectionId) return '';
      return getAudioDownloadUrl(inspectionId, audioId);
    },
    [inspectionId]
  );

  // Convert pending recordings to display format
  const pendingAsAudioResponse: AudioResponse[] = pendingRecordings.map((r) => ({
    id: r.id,
    inspectionId: '',
    fileName: r.fileName,
    mimeType: r.blob.type,
    fileSize: r.blob.size,
    duration: r.duration,
    transcriptionStatus: 'NONE' as const,
    transcription: null,
    createdAt: new Date().toISOString(),
  }));

  // Get download URL for pending recordings (using blob URL)
  const getPendingDownloadUrl = useCallback(
    async (audioId: string) => {
      const recording = pendingRecordings.find((r) => r.id === audioId);
      if (recording) {
        return URL.createObjectURL(recording.blob);
      }
      return '';
    },
    [pendingRecordings]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allRecordings = [...existingRecordings, ...pendingAsAudioResponse];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Mic className="size-5" />
        <h3 className="font-medium">Audio Notes</h3>
        {pendingRecordings.length > 0 && (
          <span className="text-xs text-muted-foreground">
            ({pendingRecordings.length} pending upload)
          </span>
        )}
      </div>

      {/* Existing and pending recordings */}
      {allRecordings.length > 0 && (
        <AudioRecordingsList
          recordings={allRecordings}
          getDownloadUrl={(audioId) =>
            audioId.startsWith('pending-')
              ? getPendingDownloadUrl(audioId)
              : getDownloadUrl(audioId)
          }
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}

      {/* Recorder */}
      <AudioRecorder
        onRecordingComplete={handleRecordingComplete}
        isUploading={isUploading}
      />
    </div>
  );
}

/**
 * Upload all pending recordings after inspection is created
 */
export async function uploadPendingRecordings(
  inspectionId: string,
  pendingRecordings: PendingRecording[],
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  const total = pendingRecordings.length;
  let completed = 0;

  for (const recording of pendingRecordings) {
    try {
      // Get upload URL
      const response = await fetch(
        `/api/inspections/${inspectionId}/audio/upload-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'x-apiary-id': localStorage.getItem('apiary-selection') || '',
          },
          body: JSON.stringify({
            fileName: recording.fileName,
            mimeType: recording.blob.type,
            fileSize: recording.blob.size,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, audioId } = await response.json();

      // Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': recording.blob.type,
        },
        body: recording.blob,
      });

      // Confirm upload
      await fetch(`/api/inspections/${inspectionId}/audio/${audioId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'x-apiary-id': localStorage.getItem('apiary-selection') || '',
        },
        body: JSON.stringify({
          duration: recording.duration,
        }),
      });

      completed++;
      onProgress?.(completed, total);
    } catch (error) {
      console.error('Failed to upload recording:', recording.fileName, error);
      // Continue with other recordings
    }
  }
}
