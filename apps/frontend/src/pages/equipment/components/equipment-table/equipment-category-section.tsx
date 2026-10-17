import type { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { EquipmentCategory } from 'shared-schemas';
import { useTranslation } from 'react-i18next';
import {
  CATEGORY_STYLES,
  ROW_GRID,
  categoryLabelKey,
} from './equipment-categories';

interface EquipmentCategorySectionProps {
  category: EquipmentCategory;
  itemCount: number;
  /** The category's rows. */
  children: ReactNode;
}

/** Category card: coloured header, column labels, then the rows. */
export function EquipmentCategorySection({
  category,
  itemCount,
  children,
}: EquipmentCategorySectionProps) {
  const { t } = useTranslation('hive');
  const style = CATEGORY_STYLES[category];
  const Icon = style.icon;

  return (
    <section
      className={cn(
        'overflow-hidden rounded-lg border border-l-4 border-border',
        style.border,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 border-b border-border/50 px-3 py-2',
          style.header,
        )}
      >
        <Icon className={cn('size-4', style.iconColor)} />
        <h3 className="text-sm font-semibold">
          {t(categoryLabelKey(category))}
        </h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {t('hive:equipment.table.itemCount', { count: itemCount })}
        </span>
      </div>

      <div
        className={cn(
          ROW_GRID,
          'border-b border-border/30 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground',
        )}
      >
        <div>{t('hive:equipment.table.item')}</div>
        <div className="text-center">
          <Tooltip>
            <TooltipTrigger className="cursor-default rounded-sm underline decoration-dotted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {t('hive:equipment.table.inUse')}
            </TooltipTrigger>
            <TooltipContent>
              {t('hive:equipment.table.inUseTooltip')}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="text-center">
          {t('hive:equipment.table.perHiveTarget')}
        </div>
        <div className="text-center">{t('hive:equipment.table.inventory')}</div>
        <div className="text-center">{t('hive:equipment.table.needed')}</div>
        <div className="text-center">{t('hive:equipment.table.status')}</div>
        <div className="text-center">{t('hive:equipment.table.actions')}</div>
      </div>

      <div className="divide-y divide-border/30">{children}</div>
    </section>
  );
}
