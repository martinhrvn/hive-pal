import { Edit2, EyeOff, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  DAMAGE_TRACKING_CATEGORIES,
  EXTRACTION_TRACKING_CATEGORIES,
  EquipmentScope,
  type EquipmentItemWithCalculations,
} from 'shared-schemas';
import { useTranslation } from 'react-i18next';
import { ROW_GRID } from './equipment-categories';
import { EquipmentStatusBadge } from './equipment-status-badge';
import { getDisplayName, round2 } from './equipment-utils';
import { NeededInfo } from './needed-info';

interface EquipmentRowProps {
  item: EquipmentItemWithCalculations;
  isUpdating: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onResetNeeded: () => void;
  onRemove: () => void;
}

function InventoryCell({ item }: { item: EquipmentItemWithCalculations }) {
  const { t } = useTranslation('hive');
  const { extra = 0, inExtraction = 0, damaged = 0 } = item;
  const tracksExtraction = EXTRACTION_TRACKING_CATEGORIES.has(item.category);
  const tracksDamage = DAMAGE_TRACKING_CATEGORIES.has(item.category);

  if (!tracksExtraction && !tracksDamage) {
    return <span>{round2(extra)}</span>;
  }

  return (
    <div className="flex flex-col items-center gap-0.5 text-xs">
      <span>
        {t('hive:equipment.table.storedValue', { value: round2(extra) })}
      </span>
      {tracksExtraction && inExtraction > 0 && (
        <span className="text-warning-foreground">
          {t('hive:equipment.table.extractingValue', {
            value: round2(inExtraction),
          })}
        </span>
      )}
      {tracksDamage && damaged > 0 && (
        <span className="text-destructive">
          {t('hive:equipment.table.damagedValue', { value: round2(damaged) })}
        </span>
      )}
    </div>
  );
}

/** Read-only equipment row; editing happens in `EquipmentRowEditor`. */
export function EquipmentRow({
  item,
  isUpdating,
  isDeleting,
  onEdit,
  onResetNeeded,
  onRemove,
}: EquipmentRowProps) {
  const { t } = useTranslation(['hive', 'common']);
  const { inUse = 0, needed = 0, recommended = 0, perHive, unit } = item;
  const displayName = getDisplayName(item);
  const isShared = item.scope === EquipmentScope.SHARED;
  const isOverridden = item.neededOverride !== null;
  const isBusy = isUpdating || isDeleting;

  return (
    <div
      className={cn(
        ROW_GRID,
        'items-center rounded-md px-3 py-3 hover:bg-muted/10',
      )}
    >
      {/* Name + scope */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 font-medium">
          {displayName}
          <span className="text-xs text-muted-foreground">({unit})</span>
        </div>
        {isShared && (
          <Tooltip>
            <TooltipTrigger className="w-fit cursor-default rounded-sm text-xs italic text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {t('hive:equipment.table.sharedTag')}
            </TooltipTrigger>
            <TooltipContent>
              {t('hive:equipment.table.sharedTooltip')}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="text-center">{round2(inUse)}</div>

      {/* Per hive / target */}
      <div className="text-center">
        <Tooltip>
          <TooltipTrigger className="cursor-default rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {round2(perHive)}
          </TooltipTrigger>
          <TooltipContent>
            {isShared
              ? t('hive:equipment.table.fixedTargetCountShared')
              : t('hive:equipment.table.perHiveValue', {
                  value: round2(perHive),
                })}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="text-center">
        <InventoryCell item={item} />
      </div>

      {/* Needed */}
      <div className="flex items-center justify-center gap-1">
        <span
          className={cn(isOverridden && 'font-medium text-info-foreground')}
        >
          {round2(needed)}
        </span>
        <NeededInfo
          recommended={recommended}
          note={
            isShared
              ? t('hive:equipment.table.fixedTarget')
              : t('hive:equipment.table.basedOnPerHive', {
                  value: round2(perHive),
                })
          }
        />
        {isOverridden && (
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            onClick={onResetNeeded}
            disabled={isBusy}
            aria-label={t('hive:equipment.table.resetNeeded')}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="text-center">
        <EquipmentStatusBadge item={item} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          onClick={onEdit}
          disabled={isBusy}
          aria-label={t('common:actions.edit')}
        >
          <Edit2 className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
          disabled={isBusy}
          aria-label={
            item.isCustom
              ? t('common:actions.delete')
              : t('hive:equipment.table.hide')
          }
        >
          {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
          {!isDeleting && item.isCustom && <Trash2 className="size-3.5" />}
          {!isDeleting && !item.isCustom && <EyeOff className="size-3.5" />}
        </Button>
      </div>
    </div>
  );
}
