import { useState, useEffect } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { AudioResponse } from 'shared-schemas';
import { Mic } from 'lucide-react';

interface AudioRecordingsListProps {
  recordings: AudioResponse[];
  getDownloadUrl: (audioId: string) => Promise<string>;
  onDelete?: (audioId: string) => void;
  deletingId?: string | null;
  className?: string;
}

export function AudioRecordingsList({
  recordings,
  getDownloadUrl,
  onDelete,
  deletingId,
  className,
}: AudioRecordingsListProps) {
  if (recordings.length === 0) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <Mic className="size-8 mb-2 opacity-50" />
          <p className="text-sm">No audio recordings</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        {recordings.map((recording) => (
          <AudioPlayerWithUrl
            key={recording.id}
            recording={recording}
            getDownloadUrl={getDownloadUrl}
            onDelete={onDelete ? () => onDelete(recording.id) : undefined}
            isDeleting={deletingId === recording.id}
          />
        ))}
      </div>
    </div>
  );
}

interface AudioPlayerWithUrlProps {
  recording: AudioResponse;
  getDownloadUrl: (audioId: string) => Promise<string>;
  onDelete?: () => void;
  isDeleting?: boolean;
}

function AudioPlayerWithUrl({
  recording,
  getDownloadUrl,
  onDelete,
  isDeleting,
}: AudioPlayerWithUrlProps) {
  // We'll fetch the URL on demand when the component mounts or when play is clicked
  // For simplicity, we use a state to cache the URL
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  const loadUrl = async () => {
    if (audioUrl || isLoadingUrl) return;
    setIsLoadingUrl(true);
    try {
      const url = await getDownloadUrl(recording.id);
      setAudioUrl(url);
    } catch (error) {
      console.error('Failed to get audio URL:', error);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Load URL on mount
  useEffect(() => {
    loadUrl();
  }, []);

  if (!audioUrl) {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg animate-pulse">
        <div className="size-9 bg-muted-foreground/20 rounded" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted-foreground/20 rounded w-1/3" />
          <div className="h-2 bg-muted-foreground/20 rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <AudioPlayer
      src={audioUrl}
      fileName={recording.fileName}
      duration={recording.duration}
      onDelete={onDelete}
      isDeleting={isDeleting}
    />
  );
}
