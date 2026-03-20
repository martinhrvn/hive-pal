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
import { Textarea } from '@/components/ui/textarea';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreatePhoto } from '@/api/hooks';
import { useTranslation } from 'react-i18next';

interface AddPhotoDialogProps {
  apiaryId: string;
  hiveId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPhotoDialog({
  apiaryId,
  hiveId,
  open,
  onOpenChange,
}: AddPhotoDialogProps) {
  const { t } = useTranslation('common');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    previewUrl: string;
    displayName: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPhoto = useCreatePhoto();

  const sanitizeFileName = (name: string) =>
    name.replace(/[<>&"'/]/g, '_');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }

    setSelectedFile({
      file,
      previewUrl: URL.createObjectURL(file),
      displayName: sanitizeFileName(file.name),
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setCaption('');
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }
    setSelectedFile(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    try {
      const formData = new FormData();
      formData.append('file', selectedFile.file);
      formData.append('apiaryId', apiaryId);
      if (hiveId) formData.append('hiveId', hiveId);
      if (caption.trim()) formData.append('caption', caption.trim());
      formData.append('date', new Date().toISOString());

      await createPhoto.mutateAsync(formData);

      toast.success(t('photo.uploadSuccess', { defaultValue: 'Photo uploaded' }));
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error(t('photo.uploadFailed', { defaultValue: 'Failed to upload photo' }));
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
          <DialogTitle>{t('photo.title', { defaultValue: 'Add Photo' })}</DialogTitle>
          <DialogDescription>
            {t('photo.description', { defaultValue: 'Upload a photo with an optional caption.' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File Input */}
          <div>
            {selectedFile ? (
              <div className="relative group">
                <img
                  src={selectedFile.previewUrl}
                  alt={selectedFile.displayName}
                  className="w-full max-h-64 object-contain rounded-md border"
                />
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(selectedFile.previewUrl);
                    setSelectedFile(null);
                  }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="text-xs text-muted-foreground mt-1">
                  {selectedFile.displayName} ({(selectedFile.file.size / 1024 / 1024).toFixed(1)} MB)
                </div>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
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
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {t('photo.selectPhoto', { defaultValue: 'Select a photo' })}
                    </span>
                  </div>
                </Button>
              </>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('photo.caption', { defaultValue: 'Caption' })}{' '}
              <span className="text-muted-foreground font-normal">
                ({t('photo.optional', { defaultValue: 'optional' })})
              </span>
            </label>
            <Textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder={t('photo.captionPlaceholder', { defaultValue: 'Describe the photo...' })}
              className="min-h-[60px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {caption.length}/500
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || createPhoto.isPending}
          >
            {createPhoto.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('photo.uploading', { defaultValue: 'Uploading...' })}
              </>
            ) : (
              t('photo.upload', { defaultValue: 'Upload Photo' })
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
