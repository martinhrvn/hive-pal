import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { apiClient } from '@/api/client';

interface DocumentDownloadLinkProps {
  documentId: string;
  fileName: string;
}

export function DocumentDownloadLink({
  documentId,
  fileName,
}: DocumentDownloadLinkProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ downloadUrl: string }>(
        `/api/documents/${documentId}/download-url`,
      )
      .then(res => setUrl(res.data.downloadUrl))
      .catch(() => {});
  }, [documentId]);

  return (
    <a
      href={url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5"
      onClick={e => {
        if (!url) e.preventDefault();
      }}
    >
      <Download className="h-3 w-3" />
      <span>{fileName}</span>
    </a>
  );
}
