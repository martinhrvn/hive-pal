import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
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
} from '@/api/hooks';
import { useApiary } from '@/hooks/use-apiary';
import { PhotoResponse, DocumentResponse } from 'shared-schemas';
import { format } from 'date-fns';

type FileType = 'all' | 'photos' | 'documents';
type DeletingItem =
  | { type: 'photo'; item: PhotoResponse }
  | { type: 'document'; item: DocumentResponse }
  | null;

function DownloadButton({ type, id }: { type: 'photo' | 'document'; id: string }) {
  const photoUrl = useStandalonePhotoDownloadUrl(id, { enabled: type === 'photo' });
  const docUrl = useDocumentDownloadUrl(id, { enabled: type === 'document' });
  const url = type === 'photo' ? photoUrl.data?.downloadUrl : docUrl.data?.downloadUrl;

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
  const { data: hives } = useHives();
  const deletePhotoMutation = useDeletePhoto();
  const deleteDocumentMutation = useDeleteDocument();

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
    type: 'photo' | 'document';
    name: string;
    fileName: string;
    hiveId: string | null;
    date: string;
    fileSize: number;
    mimeType: string;
    raw: PhotoResponse | DocumentResponse;
  };

  const rows = useMemo<FileRow[]>(() => {
    const result: FileRow[] = [];

    if (fileType !== 'documents' && photos) {
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

    if (fileType !== 'photos' && documents) {
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

    // Apply hive filter
    let filtered = hiveFilter === 'all'
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
  }, [photos, documents, fileType, hiveFilter, searchQuery]);

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      if (deletingItem.type === 'photo') {
        await deletePhotoMutation.mutateAsync(deletingItem.item.id);
        toast.success(t('photo.deleted', { defaultValue: 'Photo deleted' }));
      } else {
        await deleteDocumentMutation.mutateAsync(deletingItem.item.id);
        toast.success(t('document.deleted', { defaultValue: 'Document deleted' }));
      }
      setDeletingItem(null);
    } catch {
      toast.error(t('messages.errorOccurred'));
    }
  };

  const isLoading = photosLoading || documentsLoading;

  return (
    <PageGrid>
      <MainContent>
        <Section title={t('files.title', { defaultValue: 'Files' })}>
          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('files.search', { defaultValue: 'Search files...' })}
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
                <SelectItem value="all">{t('files.allFiles', { defaultValue: 'All Files' })}</SelectItem>
                <SelectItem value="photos">{t('files.photos', { defaultValue: 'Photos' })}</SelectItem>
                <SelectItem value="documents">{t('files.documents', { defaultValue: 'Documents' })}</SelectItem>
              </SelectContent>
            </Select>

            {hives && hives.length > 0 && (
              <Select value={hiveFilter} onValueChange={setHiveFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('files.filterByHive', { defaultValue: 'Filter by hive' })} />
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
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
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
                  <TableHead>{t('files.name', { defaultValue: 'Name' })}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('files.type', { defaultValue: 'Type' })}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('files.hive', { defaultValue: 'Hive' })}</TableHead>
                  <TableHead>{t('time.date')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('files.size', { defaultValue: 'Size' })}</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={`${row.type}-${row.id}`}>
                    <TableCell>
                      {row.type === 'photo' ? (
                        <Camera className="h-4 w-4 text-purple-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-orange-600" />
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
                        : t('files.documents', { defaultValue: 'Document' })}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {getHiveName(row.hiveId) ?? '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(row.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {formatFileSize(row.fileSize)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DownloadButton type={row.type} id={row.id} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() =>
                            setDeletingItem({
                              type: row.type,
                              item: row.raw as PhotoResponse & DocumentResponse,
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
                : t('document.deleteTitle', { defaultValue: 'Delete Document?' })}
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
              disabled={
                deletePhotoMutation.isPending || deleteDocumentMutation.isPending
              }
            >
              {deletePhotoMutation.isPending || deleteDocumentMutation.isPending
                ? t('status.loading')
                : t('actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageGrid>
  );
}

export default FilesPage;
