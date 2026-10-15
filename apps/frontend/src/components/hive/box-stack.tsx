import { Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Box } from 'shared-schemas';
import { cn } from '@/lib/utils';
import {
  DEFAULT_BOX_COLOR,
  getBoxHeight,
  getBoxTypeLabel,
} from '@/utils/box-display';

const SIZES = {
  card: {
    context: 'hive-card',
    maxVisible: 4,
    width: 'w-full',
    text: 'text-xs',
    icon: 'size-2.5',
    empty: 'h-16 w-full',
  },
  minimap: {
    context: 'minimap',
    maxVisible: 3,
    width: 'w-[85px]',
    text: 'text-[9px]',
    icon: 'size-2',
    empty: 'h-10 w-[85px]',
  },
} as const;

type BoxStackProps = {
  boxes?: Box[];
  /** `card` for the apiary layout cards, `minimap` for the hive minimap. */
  size: keyof typeof SIZES;
};

/**
 * Small proportional drawing of a hive's boxes, top box first. Shows at most a
 * few boxes plus a "+N more" note, or a dashed placeholder when there are none.
 */
export const BoxStack = ({ boxes = [], size }: BoxStackProps) => {
  const { t } = useTranslation('hive');
  const { context, maxVisible, width, text, icon, empty } = SIZES[size];

  if (boxes.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-sm border-2 border-dashed',
          empty,
        )}
      >
        <span className="text-xs text-muted-foreground">
          {t('layout.noBoxes')}
        </span>
      </div>
    );
  }

  // Highest position is the top box, so it is drawn first.
  const visible = [...boxes]
    .sort((a, b) => b.position - a.position)
    .slice(0, maxVisible);

  return (
    <div className="flex flex-col items-center gap-0.5">
      {visible.map(box => {
        const height = getBoxHeight(box.variant, context, box.type);
        return (
          <div
            key={box.id ?? `pos-${box.position}`}
            className={cn(
              'relative rounded-sm border border-black/30 text-white/90',
              width,
              text,
            )}
            style={{
              backgroundColor: box.color || DEFAULT_BOX_COLOR,
              height: `${height}px`,
            }}
          >
            <span className="absolute top-0.5 right-1 font-medium">
              {t(`layout.boxTypeShort.${box.type.toLowerCase()}`, {
                defaultValue: getBoxTypeLabel(box.type),
              })}
            </span>
            {/* Frame count only where the box is tall enough to fit it */}
            {height >= 28 && (
              <span className="absolute bottom-0.5 left-1 flex items-center gap-0.5">
                <Package className={cn('text-white/80', icon)} />
                {box.frameCount}
              </span>
            )}
            {/* Wood grain */}
            <div className="absolute inset-0 rounded-sm opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]" />
          </div>
        );
      })}
      {boxes.length > maxVisible && (
        <span className={cn('mt-0.5 text-muted-foreground', text)}>
          {t('layout.moreBoxes', { count: boxes.length - maxVisible })}
        </span>
      )}
    </div>
  );
};
