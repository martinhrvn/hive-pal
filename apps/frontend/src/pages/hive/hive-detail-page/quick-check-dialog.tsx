import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, ImagePlus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFeatures, QUICK_CHECK_KEYS } from '@/api/hooks';
import { apiClient } from '@/api/client';
import { cn } from '@/lib/utils';
import { CreateQuickCheck, QuickCheckResponse } from 'shared-schemas';
import { useTranslation } from 'react-i18next';

interface QuickCheckDialogProps {
  hiveId?: string;
  apiaryId: string;
  /** "sidebar" renders as a full-width ghost button; "inline" renders as a compact outlined button */
  triggerVariant?: 'sidebar' | 'inline';
  /** When provided, the dialog is controlled externally (no trigger rendered) */
  open?: boolean;
  /** Called when the dialog open state changes (controlled mode) */
  onOpenChange?: (open: boolean) => void;
}

// Labels come from the inspection form's observation keys, so a tag reads the
// same in a quick check as in a full inspection.
const ADDITIONAL_OBSERVATION_TAGS = [
  'calm',
  'defensive',
  'aggressive',
  'nervous',
  'varroa_present',
  'small_hive_beetle',
  'wax_moths',
  'ants_present',
  'healthy',
  'active',
  'sluggish',
  'thriving',
] as const;

const REMINDER_OBSERVATION_TAGS = [
  'honey_bound',
  'overcrowded',
  'needs_super',
  'queen_issues',
  'requires_treatment',
  'low_stores',
  'prepare_for_winter',
] as const;

export function QuickCheckDialog({
  hiveId,
  apiaryId,
  triggerVariant = 'sidebar',
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: QuickCheckDialogProps) {
  const { t } = useTranslation(['common', 'inspection', 'hive']);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => controlledOnOpenChange?.(v)
    : setInternalOpen;
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<
    Array<{ file: File; previewUrl: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { data: features } = useFeatures();

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag],
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - selectedFiles.length;
    if (files.length > remaining) {
      toast.error(t('common:quickCheck.maxPhotos', { remaining }));
    }
    // Create stable preview URLs before resetting the input,
    // since mobile browsers may invalidate File blobs after input reset
    const newEntries = files.slice(0, remaining).map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setSelectedFiles(prev => [...prev, ...newEntries]);
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const resetForm = () => {
    setSelectedTags([]);
    setNote('');
    selectedFiles.forEach(entry => URL.revokeObjectURL(entry.previewUrl));
    setSelectedFiles([]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const dto: CreateQuickCheck = {
        apiaryId,
        hiveId,
        tags: selectedTags as Array<
          | (typeof ADDITIONAL_OBSERVATION_TAGS)[number]
          | (typeof REMINDER_OBSERVATION_TAGS)[number]
        >,
        note: note.trim() || undefined,
        date: new Date().toISOString(),
      };

      // Create the quick check without triggering query invalidation yet
      const { data: result } = await apiClient.post<QuickCheckResponse>(
        '/api/quick-checks',
        dto,
      );

      // Upload photos sequentially
      for (const { file } of selectedFiles) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          await apiClient.post(
            `/api/quick-checks/${result.id}/photos`,
            formData,
          );
        } catch {
          toast.error(t('common:quickCheck.uploadFailed', { name: file.name }));
        }
      }

      // Invalidate queries after all uploads complete so timeline shows photos
      await queryClient.invalidateQueries({
        queryKey: QUICK_CHECK_KEYS.all,
      });

      toast.success(t('common:quickCheck.saved'));
      resetForm();
      setOpen(false);
    } catch {
      toast.error(t('common:quickCheck.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      {!isControlled && (
        <DialogTrigger asChild>
          {triggerVariant === 'sidebar' ? (
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              {t('common:quickCheck.title')}
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              {t('common:quickCheck.title')}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('common:quickCheck.title')}</DialogTitle>
          <DialogDescription>
            {t('common:quickCheck.dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Observation Tags */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('inspection:observations.title')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ADDITIONAL_OBSERVATION_TAGS.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer select-none',
                    selectedTags.includes(tag) &&
                      'bg-blue-600 hover:bg-blue-700',
                  )}
                  onClick={() => toggleTag(tag)}
                >
                  {t(`inspection:observations.additional.${tag}`)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Reminder Tags */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('inspection:observations.reminderObservations')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {REMINDER_OBSERVATION_TAGS.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer select-none',
                    selectedTags.includes(tag) &&
                      'bg-amber-600 hover:bg-amber-700',
                  )}
                  onClick={() => toggleTag(tag)}
                >
                  {t(`inspection:observations.reminder.${tag}`)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('common:quickCheck.note')}{' '}
              <span className="text-muted-foreground font-normal">
                {t('common:quickCheck.optional')}
              </span>
            </label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={t('common:quickCheck.notePlaceholder')}
              className="min-h-[80px] resize-none"
              maxLength={2000}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {note.length}/2000
            </div>
          </div>

          {/* Photo Upload */}
          {features?.storageEnabled && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('common:quickCheck.photos')}{' '}
                <span className="text-muted-foreground font-normal">
                  {t('common:quickCheck.photosOptional')}
                </span>
              </label>

              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedFiles.map((entry, index) => (
                    <div
                      key={index}
                      className="relative group w-16 h-16 rounded-md overflow-hidden border"
                    >
                      <img
                        src={entry.previewUrl}
                        alt={entry.file.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-0 right-0 bg-black/60 text-white rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedFiles.length < 5 && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {t('common:quickCheck.addPhotos')}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || (selectedTags.length === 0 && !note.trim())
            }
            data-umami-event="Quick Check Save"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('hive:settings.saving')}
              </>
            ) : (
              t('common:quickCheck.save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
