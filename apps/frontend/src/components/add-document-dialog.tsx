import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUp, X, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateDocument } from '@/api/hooks';
import { useTranslation } from 'react-i18next';

interface AddDocumentDialogProps {
  apiaryId: string;
  hiveId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddDocumentDialog({
  apiaryId,
  hiveId,
  open,
  onOpenChange,
}: AddDocumentDialogProps) {
  const { t } = useTranslation('common');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createDocument = useCreateDocument();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setSelectedFile(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !title.trim()) return;

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('apiaryId', apiaryId);
      if (hiveId) formData.append('hiveId', hiveId);
      formData.append('title', title.trim());
      if (notes.trim()) formData.append('notes', notes.trim());
      formData.append('date', new Date().toISOString());

      await createDocument.mutateAsync(formData);

      toast.success(t('document.uploadSuccess', { defaultValue: 'Document uploaded' }));
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error(t('document.uploadFailed', { defaultValue: 'Failed to upload document' }));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        onOpenChange(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('document.title', { defaultValue: 'Add Document' })}</DialogTitle>
          <DialogDescription>
            {t('document.description', { defaultValue: 'Upload a PDF or scanned document.' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File Input */}
          <div>
            {selectedFile ? (
              <div className="flex items-center gap-3 p-3 border rounded-md">
                <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {selectedFile.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-32 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <FileUp className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {t('document.selectFile', { defaultValue: 'Select a file (PDF, JPEG, PNG)' })}
                    </span>
                  </div>
                </Button>
              </>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('document.titleField', { defaultValue: 'Title' })}
            </label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('document.titlePlaceholder', { defaultValue: 'Document title' })}
              maxLength={200}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('document.notes', { defaultValue: 'Notes' })}{' '}
              <span className="text-muted-foreground font-normal">
                ({t('document.optional', { defaultValue: 'optional' })})
              </span>
            </label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('document.notesPlaceholder', { defaultValue: 'Add notes about this document...' })}
              className="min-h-[60px] resize-none"
              maxLength={2000}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {notes.length}/2000
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || !title.trim() || createDocument.isPending}
          >
            {createDocument.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('document.uploading', { defaultValue: 'Uploading...' })}
              </>
            ) : (
              t('document.upload', { defaultValue: 'Upload Document' })
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
