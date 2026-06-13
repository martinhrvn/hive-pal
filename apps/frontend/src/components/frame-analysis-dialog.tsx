import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScanSearch, Loader2 } from 'lucide-react';
import { FRAME_CELL_CLASSES, FrameCellClass } from 'shared-schemas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useAnalyzeFrame,
  useFrameAnalysis,
  useStandalonePhotoDownloadUrl,
} from '@/api/hooks';

// Color per comb-cell class, used for the bars. Order matches FRAME_CELL_CLASSES.
const CLASS_COLORS: Record<FrameCellClass, string> = {
  egg: 'bg-sky-400',
  larvae: 'bg-amber-300',
  cappedBrood: 'bg-amber-700',
  honey: 'bg-yellow-400',
  pollen: 'bg-orange-400',
  nectar: 'bg-lime-400',
  other: 'bg-stone-300',
};

type Props = {
  photoId: string;
  /** Render your own trigger instead of the default icon button. */
  children?: React.ReactNode;
};

export const FrameAnalysisDialog: React.FC<Props> = ({ photoId, children }) => {
  const { t } = useTranslation('ai');
  const [open, setOpen] = useState(false);

  const { data: existing } = useFrameAnalysis(photoId, { enabled: open });
  const { data: urlData } = useStandalonePhotoDownloadUrl(photoId, {
    enabled: open,
  });
  const analyze = useAnalyzeFrame();

  // Prefer a freshly computed result, fall back to the cached one.
  const result = analyze.data ?? existing ?? null;

  useEffect(() => {
    if (!open) analyze.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-stone-400 hover:text-violet-600 opacity-0 group-hover/row:opacity-100 transition-opacity"
            title={t('frameAnalysis.analyze', { defaultValue: 'Analyze frame' })}
            onClick={e => e.stopPropagation()}
          >
            <ScanSearch className="h-3 w-3" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('frameAnalysis.title', { defaultValue: 'Frame analysis' })}
          </DialogTitle>
          <DialogDescription>
            {t('frameAnalysis.description', {
              defaultValue: 'Detect and classify comb cells in this photo.',
            })}
          </DialogDescription>
        </DialogHeader>

        {urlData?.downloadUrl && (
          <img
            src={urlData.downloadUrl}
            alt=""
            className="w-full max-h-48 object-cover rounded-md border border-stone-200 dark:border-stone-700"
          />
        )}

        {result ? (
          <div className="space-y-2">
            <div className="text-sm text-stone-600 dark:text-stone-400">
              {t('frameAnalysis.totalCells', {
                count: result.totalCells,
                defaultValue: '{{count}} cells detected',
              })}
            </div>
            <ul className="space-y-1.5">
              {FRAME_CELL_CLASSES.map(cls => {
                const pct = result.percentages[cls];
                return (
                  <li key={cls} className="text-xs">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-stone-700 dark:text-stone-300">
                        {t(`frameAnalysis.classes.${cls}`, {
                          defaultValue: cls,
                        })}
                      </span>
                      <span className="tabular-nums text-stone-500">
                        {result.counts[cls]} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${CLASS_COLORS[cls]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          analyze.isError && (
            <div className="text-sm text-destructive">
              {t('frameAnalysis.error', { defaultValue: 'Analysis failed' })}
            </div>
          )
        )}

        <Button
          onClick={() => analyze.mutate(photoId)}
          disabled={analyze.isPending}
          className="w-full"
        >
          {analyze.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {analyze.isPending
            ? t('frameAnalysis.analyzing', { defaultValue: 'Analyzing…' })
            : result
              ? t('frameAnalysis.reanalyze', { defaultValue: 'Re-analyze' })
              : t('frameAnalysis.analyze', { defaultValue: 'Analyze frame' })}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
