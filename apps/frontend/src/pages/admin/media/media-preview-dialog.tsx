import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAdminMediaDownloadUrl } from '@/api/hooks';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import type { AdminMediaItem } from 'shared-schemas';
import { formatBytes } from './format-bytes';

type Props = {
  item: AdminMediaItem | null;
  onClose: () => void;
};

export function MediaPreviewDialog({ item, onClose }: Props) {
  const { data, isLoading } = useAdminMediaDownloadUrl(item?.type, item?.id, {
    enabled: !!item,
  });

  const url = data?.downloadUrl;
  const isImage = item?.mimeType.startsWith('image/');
  const isAudio = item?.mimeType.startsWith('audio/');
  const isPdf = item?.mimeType === 'application/pdf';

  return (
    <Dialog open={!!item} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate">{item?.fileName}</DialogTitle>
          <DialogDescription>
            {item?.type} · {item ? formatBytes(item.fileSize) : ''} ·{' '}
            {item?.mimeType}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[200px] flex items-center justify-center bg-muted/30 rounded-md overflow-hidden">
          {isLoading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
          {!isLoading && url && isImage && (
            <img
              src={url}
              alt={item?.fileName}
              className="max-h-[60vh] w-auto object-contain"
            />
          )}
          {!isLoading && url && isAudio && (
            <audio controls src={url} className="w-full p-4" />
          )}
          {!isLoading && url && isPdf && (
            <iframe
              src={url}
              title={item?.fileName}
              className="w-full h-[60vh]"
            />
          )}
          {!isLoading && url && !isImage && !isAudio && !isPdf && (
            <div className="p-6 text-sm text-muted-foreground">
              No inline preview for this file type.
            </div>
          )}
          {!isLoading && !url && (
            <div className="p-6 text-sm text-destructive">
              Could not load preview URL.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            disabled={!url}
            onClick={() => url && window.open(url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in new tab
          </Button>
          <Button
            disabled={!url}
            onClick={() => {
              if (!url) return;
              const a = document.createElement('a');
              a.href = url;
              a.download = item?.fileName ?? 'download';
              a.click();
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
