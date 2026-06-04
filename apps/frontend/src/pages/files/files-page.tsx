import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Camera,
  FileText,
  Mic,
  Sparkles,
  Download,
  Trash2,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageGrid, MainContent } from '@/components/layout/page-grid-layout';
import { Section } from '@/components/common/section';
import {
  usePhotos,
  useDocuments,
  useDeletePhoto,
  useDeleteDocument,
  useStandalonePhotoDownloadUrl,
  useDocumentDownloadUrl,
  useHives,
  useApiaryAudio,
  useDeleteApiaryAudio,
  useStartPendingAnalysis,
  useStartInspectionAudioAi,
} from '@/api/hooks';
import { useApiary } from '@/hooks/use-apiary';
import {
  PhotoResponse,
  DocumentResponse,
  ApiaryAudioResponse,
  TranscriptionStatus,
} from 'shared-schemas';
import { format } from 'date-fns';

type FileType = 'all' | 'photos' | 'documents' | 'audio';
type DeletingItem =
  | { type: 'photo'; item: PhotoResponse }
  | { type: 'document'; item: DocumentResponse }
  | { type: 'audio'; item: ApiaryAudioResponse }
  | null;

function DownloadButton({
  type,
  id,
  inspectionId,
}: {
  type: 'photo' | 'document';
  id: string;
  inspectionId?: string;
}) {
  void inspectionId;
  const photoUrl = useStandalonePhotoDownloadUrl(id, {
    enabled: type === 'photo',
  });
  const docUrl = useDocumentDownloadUrl(id, { enabled: type === 'document' });
  const url =
    type === 'photo' ? photoUrl.data?.downloadUrl : docUrl.data?.downloadUrl;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      disabled={!url}
      onClick={() => {
        if (url) window.open(url, '_blank');
      }}
    >
      <Download className="h-3.5 w-3.5" />
    </Button>
  );
}

function SendToAiButton({
  inspectionId,
  audioId,
  disabled,
  label,
}: {
  inspectionId: string;
  audioId: string;
  disabled: boolean;
  label: string;
}) {
  const mutation = useStartInspectionAudioAi(inspectionId, audioId);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-amber-600 hover:text-amber-700"
      title={label}
      disabled={disabled || mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      <Sparkles className="h-3.5 w-3.5" />
    </Button>
  );
}

type AudioStatusTone =
  | 'gray'
  | 'amber'
  | 'blue'
  | 'red'
  | 'sky'
  | 'green';

const TONE_CLASSES: Record<AudioStatusTone, string> = {
  gray: 'border-gray-300 text-gray-600',
  amber: 'border-amber-300 text-amber-700 bg-amber-50',
  blue: 'border-blue-300 text-blue-700 bg-blue-50',
  red: 'border-red-300 text-red-700 bg-red-50',
  sky: 'border-sky-300 text-sky-700 bg-sky-50',
  green: 'border-green-300 text-green-700 bg-green-50',
};

function deriveAudioStatus(
  t: (key: string) => string,
  transcription: TranscriptionStatus,
  analysis: TranscriptionStatus,
): { label: string; tone: AudioStatusTone } {
  if (transcription !== 'COMPLETED') {
    if (transcription === 'PROCESSING')
      return {
        label: t('files.audioStatus.transcribing'),
        tone: 'blue',
      };
    if (transcription === 'PENDING')
      return { label: t('files.audioStatus.queued'), tone: 'amber' };
    if (transcription === 'FAILED')
      return { label: t('files.audioStatus.failed'), tone: 'red' };
    return {
      label: t('files.audioStatus.notTranscribed'),
      tone: 'gray',
    };
  }
  if (analysis === 'COMPLETED')
    return { label: t('files.audioStatus.ready'), tone: 'green' };
  if (analysis === 'PROCESSING')
    return { label: t('files.audioStatus.analyzing'), tone: 'blue' };
  if (analysis === 'PENDING')
    return { label: t('files.audioStatus.queued'), tone: 'amber' };
  if (analysis === 'FAILED')
    return {
      label: t('files.audioStatus.analysisFailed'),
      tone: 'red',
    };
  return { label: t('files.audioStatus.transcribed'), tone: 'sky' };
}

const isPendingForBulk = (a: ApiaryAudioResponse) =>
  a.transcriptionStatus === 'NONE' || a.transcriptionStatus === 'FAILED';

const isAudioBusy = (a: ApiaryAudioResponse) =>
  a.transcriptionStatus === 'PENDING' ||
  a.transcriptionStatus === 'PROCESSING' ||
  a.analysisStatus === 'PENDING' ||
  a.analysisStatus === 'PROCESSING';

export function FilesPage() {
  const { t } = useTranslation('common');
  const { activeApiaryId } = useApiary();
  const [fileType, setFileType] = useState<FileType>('all');
  const [hiveFilter, setHiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingItem, setDeletingItem] = useState<DeletingItem>(null);

  const { data: photos, isLoading: photosLoading } = usePhotos(
    activeApiaryId ? { apiaryId: activeApiaryId } : undefined,
    { enabled: !!activeApiaryId },
  );
  const { data: documents, isLoading: documentsLoading } = useDocuments(
    activeApiaryId ? { apiaryId: activeApiaryId } : undefined,
    { enabled: !!activeApiaryId },
  );
  const { data: audio, isLoading: audioLoading } = useApiaryAudio(
    activeApiaryId,
    { enabled: !!activeApiaryId },
  );
  const { data: hives } = useHives();
  const deletePhotoMutation = useDeletePhoto();
  const deleteDocumentMutation = useDeleteDocument();
  const deleteAudioMutation = useDeleteApiaryAudio(activeApiaryId);
  const startPendingAnalysis = useStartPendingAnalysis(activeApiaryId);

  const getHiveName = useCallback(
    (hiveId: string | null) => {
      if (!hiveId || !hives) return null;
      return hives.find(h => h.id === hiveId)?.name ?? null;
    },
    [hives],
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  type FileRow = {
    id: string;
    type: 'photo' | 'document' | 'audio';
    name: string;
    fileName: string;
    hiveId: string | null;
    date: string;
    fileSize: number;
    mimeType: string;
    raw: PhotoResponse | DocumentResponse | ApiaryAudioResponse;
    // audio-only
    inspectionId?: string;
    transcriptionStatus?: TranscriptionStatus;
    analysisStatus?: TranscriptionStatus;
  };

  const rows = useMemo<FileRow[]>(() => {
    const result: FileRow[] = [];

    if (fileType === 'all' || fileType === 'photos') {
      if (photos) {
        photos.forEach(p => {
          result.push({
            id: p.id,
            type: 'photo',
            name: p.caption || p.fileName,
            fileName: p.fileName,
            hiveId: p.hiveId,
            date: p.date,
            fileSize: p.fileSize,
            mimeType: p.mimeType,
            raw: p,
          });
        });
      }
    }

    if (fileType === 'all' || fileType === 'documents') {
      if (documents) {
        documents.forEach(d => {
          result.push({
            id: d.id,
            type: 'document',
            name: d.title,
            fileName: d.fileName,
            hiveId: d.hiveId,
            date: d.date,
            fileSize: d.fileSize,
            mimeType: d.mimeType,
            raw: d,
          });
        });
      }
    }

    if (fileType === 'all' || fileType === 'audio') {
      if (audio) {
        audio.forEach(a => {
          result.push({
            id: a.id,
            type: 'audio',
            name: a.fileName,
            fileName: a.fileName,
            hiveId: a.hiveId,
            date: a.inspectionDate,
            fileSize: a.fileSize,
            mimeType: a.mimeType,
            raw: a,
            inspectionId: a.inspectionId,
            transcriptionStatus: a.transcriptionStatus,
            analysisStatus: a.analysisStatus,
          });
        });
      }
    }

    // Apply hive filter
    let filtered =
      hiveFilter === 'all'
        ? result
        : result.filter(r => r.hiveId === hiveFilter);

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.fileName.toLowerCase().includes(q),
      );
    }

    // Sort by date descending
    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [photos, documents, audio, fileType, hiveFilter, searchQuery]);

  const showStatusColumn = fileType === 'all' || fileType === 'audio';
  const pendingAudioCount = useMemo(
    () => (audio ?? []).filter(isPendingForBulk).length,
    [audio],
  );
  const showBulkAiButton =
    (fileType === 'all' || fileType === 'audio') && pendingAudioCount > 0;

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      if (deletingItem.type === 'photo') {
        await deletePhotoMutation.mutateAsync(deletingItem.item.id);
        toast.success(t('photo.deleted', { defaultValue: 'Photo deleted' }));
      } else if (deletingItem.type === 'document') {
        await deleteDocumentMutation.mutateAsync(deletingItem.item.id);
        toast.success(
          t('document.deleted', { defaultValue: 'Document deleted' }),
        );
      } else {
        await deleteAudioMutation.mutateAsync({
          inspectionId: deletingItem.item.inspectionId,
          audioId: deletingItem.item.id,
        });
        toast.success(t('files.audioDeleted'));
      }
      setDeletingItem(null);
    } catch {
      toast.error(t('messages.errorOccurred'));
    }
  };

  const handleSendAll = async () => {
    try {
      const result = await startPendingAnalysis.mutateAsync();
      toast.success(t('files.sentToAi', { count: result.started }));
    } catch {
      toast.error(t('messages.errorOccurred'));
    }
  };

  const isLoading = photosLoading || documentsLoading || audioLoading;
  const isDeleting =
    deletePhotoMutation.isPending ||
    deleteDocumentMutation.isPending ||
    deleteAudioMutation.isPending;

  return (
    <PageGrid>
      <MainContent>
        <Section title={t('files.title', { defaultValue: 'Files' })}>
          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('files.search', {
                  defaultValue: 'Search files...',
                })}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 w-48"
              />
            </div>

            <Select
              value={fileType}
              onValueChange={v => setFileType(v as FileType)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('files.allFiles', { defaultValue: 'All Files' })}
                </SelectItem>
                <SelectItem value="photos">
                  {t('files.photos', { defaultValue: 'Photos' })}
                </SelectItem>
                <SelectItem value="documents">
                  {t('files.documents', { defaultValue: 'Documents' })}
                </SelectItem>
                <SelectItem value="audio">
                  {t('files.audio', { defaultValue: 'Audio' })}
                </SelectItem>
              </SelectContent>
            </Select>

            {hives && hives.length > 0 && (
              <Select value={hiveFilter} onValueChange={setHiveFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue
                    placeholder={t('files.filterByHive', {
                      defaultValue: 'Filter by hive',
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('timeline.allHives')}</SelectItem>
                  {hives.map(hive => (
                    <SelectItem key={hive.id} value={hive.id}>
                      {hive.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {showBulkAiButton && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                disabled={startPendingAnalysis.isPending}
                onClick={handleSendAll}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                {t('files.sendAllPending', { count: pendingAudioCount })}
              </Button>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              {t('files.noFiles', { defaultValue: 'No files uploaded yet' })}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>
                    {t('files.name', { defaultValue: 'Name' })}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t('files.type', { defaultValue: 'Type' })}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t('files.hive', { defaultValue: 'Hive' })}
                  </TableHead>
                  <TableHead>{t('time.date')}</TableHead>
                  {showStatusColumn && (
                    <TableHead className="hidden md:table-cell">
                      {t('files.status', { defaultValue: 'Status' })}
                    </TableHead>
                  )}
                  <TableHead className="hidden md:table-cell">
                    {t('files.size', { defaultValue: 'Size' })}
                  </TableHead>
                  <TableHead className="w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => {
                  const audioRaw =
                    row.type === 'audio'
                      ? (row.raw as ApiaryAudioResponse)
                      : null;
                  const status =
                    row.type === 'audio' &&
                    row.transcriptionStatus &&
                    row.analysisStatus
                      ? deriveAudioStatus(
                          t,
                          row.transcriptionStatus,
                          row.analysisStatus,
                        )
                      : null;
                  return (
                    <TableRow key={`${row.type}-${row.id}`}>
                      <TableCell>
                        {row.type === 'photo' ? (
                          <Camera className="h-4 w-4 text-purple-600" />
                        ) : row.type === 'document' ? (
                          <FileText className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Mic className="h-4 w-4 text-cyan-600" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm truncate max-w-[200px]">
                          {row.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {row.fileName}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {row.type === 'photo'
                          ? t('files.photos', { defaultValue: 'Photo' })
                          : row.type === 'document'
                            ? t('files.documents', {
                                defaultValue: 'Document',
                              })
                            : t('files.audio', { defaultValue: 'Audio' })}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {getHiveName(row.hiveId) ?? '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(row.date), 'MMM d, yyyy')}
                      </TableCell>
                      {showStatusColumn && (
                        <TableCell className="hidden md:table-cell text-sm">
                          {status ? (
                            <Badge
                              variant="outline"
                              className={TONE_CLASSES[status.tone]}
                            >
                              {status.label}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">–</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="hidden md:table-cell text-sm">
                        {formatFileSize(row.fileSize)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {row.type === 'audio' && audioRaw ? (
                            <SendToAiButton
                              inspectionId={audioRaw.inspectionId}
                              audioId={audioRaw.id}
                              disabled={isAudioBusy(audioRaw)}
                              label={t('files.sendToAi')}
                            />
                          ) : null}
                          {row.type !== 'audio' ? (
                            <DownloadButton type={row.type} id={row.id} />
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (row.type === 'photo') {
                                setDeletingItem({
                                  type: 'photo',
                                  item: row.raw as PhotoResponse,
                                });
                              } else if (row.type === 'document') {
                                setDeletingItem({
                                  type: 'document',
                                  item: row.raw as DocumentResponse,
                                });
                              } else {
                                setDeletingItem({
                                  type: 'audio',
                                  item: row.raw as ApiaryAudioResponse,
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Section>
      </MainContent>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingItem}
        onOpenChange={open => !open && setDeletingItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deletingItem?.type === 'photo'
                ? t('photo.deleteTitle', { defaultValue: 'Delete Photo?' })
                : deletingItem?.type === 'document'
                  ? t('document.deleteTitle', {
                      defaultValue: 'Delete Document?',
                    })
                  : t('files.audioDeleteTitle', {
                      defaultValue: 'Delete audio recording?',
                    })}
            </DialogTitle>
            <DialogDescription>
              {t('messages.confirmDelete')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('actions.cancel')}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? t('status.loading') : t('actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageGrid>
  );
}

export default FilesPage;
