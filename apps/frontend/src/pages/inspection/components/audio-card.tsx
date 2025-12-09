import { useState, useCallback } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AudioRecordingsList } from '@/components/audio';
import {
  useInspectionAudio,
  useDeleteInspectionAudio,
  getAudioDownloadUrl,
} from '@/api/hooks/useInspectionAudio';

interface AudioCardProps {
  inspectionId: string;
}

export function AudioCard({ inspectionId }: AudioCardProps) {
  const { data: recordings = [], isLoading } = useInspectionAudio(inspectionId);
  const deleteAudio = useDeleteInspectionAudio(inspectionId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (audioId: string) => {
      setDeletingId(audioId);
      try {
        await deleteAudio.mutateAsync(audioId);
      } finally {
        setDeletingId(null);
      }
    },
    [deleteAudio]
  );

  const getDownloadUrl = useCallback(
    async (audioId: string) => {
      return getAudioDownloadUrl(inspectionId, audioId);
    },
    [inspectionId]
  );

  // Don't render the card if there are no recordings and we're not loading
  if (!isLoading && recordings.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="size-5" />
          Audio Notes
          {recordings.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({recordings.length} {recordings.length === 1 ? 'recording' : 'recordings'})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <AudioRecordingsList
            recordings={recordings}
            getDownloadUrl={getDownloadUrl}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        )}
      </CardContent>
    </Card>
  );
}
