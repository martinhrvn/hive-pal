import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/use-is-admin';
import {
  useAdminMediaList,
  useAdminMediaStats,
} from '@/api/hooks/useAdminMedia';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Camera,
  FileText,
  Mic,
  Image as ImageIcon,
  HardDrive,
  Files,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import type { AdminMediaItem, AdminMediaType } from 'shared-schemas';
import { formatBytes } from './format-bytes';
import { MediaPreviewDialog } from './media-preview-dialog';

type TypeFilter = AdminMediaType | 'all';

const TYPE_LABEL: Record<AdminMediaType, string> = {
  photo: 'Photo',
  document: 'Document',
  'inspection-audio': 'Inspection audio',
  'quick-check-photo': 'Quick check photo',
};

const TYPE_ICON: Record<AdminMediaType, React.ComponentType<{ className?: string }>> = {
  photo: Camera,
  document: FileText,
  'inspection-audio': Mic,
  'quick-check-photo': ImageIcon,
};

const MediaPage: React.FC = () => {
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [previewItem, setPreviewItem] = useState<AdminMediaItem | null>(null);
  const pageSize = 50;

  const { data: stats } = useAdminMediaStats();
  const { data: list, isLoading } = useAdminMediaList({
    type: typeFilter === 'all' ? undefined : typeFilter,
    search: search || undefined,
    page,
    pageSize,
  });

  React.useEffect(() => {
    if (!isAdmin) navigate('/');
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  const totalPages = list ? Math.max(1, Math.ceil(list.total / pageSize)) : 1;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Media</h1>
        <p className="text-muted-foreground">
          Browse and preview all uploaded files across the platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total files</CardTitle>
            <Files className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCount ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Space used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatBytes(stats.totalSize) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {stats?.byType.map(s => (
                <div key={s.type} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {TYPE_LABEL[s.type]}
                  </span>
                  <span className="font-medium">
                    {s.count} · {formatBytes(s.totalSize)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle>Files</CardTitle>
              <CardDescription>
                {list ? `${list.total} total · page ${page} of ${totalPages}` : ' '}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <form onSubmit={handleSearchSubmit}>
                <Input
                  placeholder="Search filename, caption..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full sm:w-64"
                />
              </form>
              <Select
                value={typeFilter}
                onValueChange={v => {
                  setTypeFilter(v as TypeFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="photo">Photos</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="inspection-audio">Inspection audio</SelectItem>
                  <SelectItem value="quick-check-photo">Quick check photos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Apiary</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && list?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No files found.
                  </TableCell>
                </TableRow>
              )}
              {list?.items.map(item => {
                const Icon = TYPE_ICON[item.type];
                return (
                  <TableRow key={`${item.type}-${item.id}`}>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Icon className="h-3 w-3" />
                        {TYPE_LABEL[item.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <div className="truncate font-medium">{item.fileName}</div>
                      {item.caption && (
                        <div className="truncate text-xs text-muted-foreground">
                          {item.caption}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">{item.mimeType}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.ownerEmail ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.apiaryName ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBytes(item.fileSize)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(item.createdAt), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPreviewItem(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex items-center justify-end gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <MediaPreviewDialog item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
};

export default MediaPage;
