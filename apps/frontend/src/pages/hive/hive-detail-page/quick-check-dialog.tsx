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

interface QuickCheckDialogProps {
  hiveId?: string;
  apiaryId: string;
  /** "sidebar" renders as a full-width ghost button; "inline" renders as a compact outlined button */
  triggerVariant?: 'sidebar' | 'inline';
}

const ADDITIONAL_OBSERVATION_TAGS = [
  { value: 'calm', label: 'Calm' },
  { value: 'defensive', label: 'Defensive' },
  { value: 'aggressive', label: 'Aggressive' },
  { value: 'nervous', label: 'Nervous' },
  { value: 'varroa_present', label: 'Varroa Present' },
  { value: 'small_hive_beetle', label: 'Small Hive Beetle' },
  { value: 'wax_moths', label: 'Wax Moths' },
  { value: 'ants_present', label: 'Ants Present' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'active', label: 'Active' },
  { value: 'sluggish', label: 'Sluggish' },
  { value: 'thriving', label: 'Thriving' },
] as const;

const REMINDER_OBSERVATION_TAGS = [
  { value: 'honey_bound', label: 'Honey Bound' },
  { value: 'overcrowded', label: 'Overcrowded' },
  { value: 'needs_super', label: 'Needs Super' },
  { value: 'queen_issues', label: 'Queen Issues' },
  { value: 'requires_treatment', label: 'Requires Treatment' },
  { value: 'low_stores', label: 'Low Stores' },
  { value: 'prepare_for_winter', label: 'Prepare for Winter' },
] as const;

export function QuickCheckDialog({
  hiveId,
  apiaryId,
  triggerVariant = 'sidebar',
}: QuickCheckDialogProps) {
  const [open, setOpen] = useState(false);
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
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - selectedFiles.length;
    if (files.length > remaining) {
      toast.error(`Maximum 5 photos allowed. You can add ${remaining} more.`);
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
          | (typeof ADDITIONAL_OBSERVATION_TAGS)[number]['value']
          | (typeof REMINDER_OBSERVATION_TAGS)[number]['value']
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
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      // Invalidate queries after all uploads complete so timeline shows photos
      await queryClient.invalidateQueries({
        queryKey: QUICK_CHECK_KEYS.all,
      });

      toast.success('Quick check saved');
      resetForm();
      setOpen(false);
    } catch {
      toast.error('Failed to save quick check');
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
      <DialogTrigger asChild>
        {triggerVariant === 'sidebar' ? (
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Quick Check
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Quick Check
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Check</DialogTitle>
          <DialogDescription>
            Record a quick observation with tags and an optional note.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Observation Tags */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Observations
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ADDITIONAL_OBSERVATION_TAGS.map(tag => (
                <Badge
                  key={tag.value}
                  variant={
                    selectedTags.includes(tag.value) ? 'default' : 'outline'
                  }
                  className={cn(
                    'cursor-pointer select-none',
                    selectedTags.includes(tag.value) &&
                      'bg-blue-600 hover:bg-blue-700',
                  )}
                  onClick={() => toggleTag(tag.value)}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Reminder Tags */}
          <div>
            <label className="text-sm font-medium mb-2 block">Reminders</label>
            <div className="flex flex-wrap gap-1.5">
              {REMINDER_OBSERVATION_TAGS.map(tag => (
                <Badge
                  key={tag.value}
                  variant={
                    selectedTags.includes(tag.value) ? 'default' : 'outline'
                  }
                  className={cn(
                    'cursor-pointer select-none',
                    selectedTags.includes(tag.value) &&
                      'bg-amber-600 hover:bg-amber-700',
                  )}
                  onClick={() => toggleTag(tag.value)}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Note{' '}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What did you observe?"
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
                Photos{' '}
                <span className="text-muted-foreground font-normal">
                  (optional, max 5)
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
                    Add Photos
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
                Saving...
              </>
            ) : (
              'Save Quick Check'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
