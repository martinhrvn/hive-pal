import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { EquipmentItemWithCalculations } from 'shared-schemas';
import { useTranslation } from 'react-i18next';
import { round2 } from './equipment-utils';

/** Need / surplus / exact badge for one equipment row. */
export function EquipmentStatusBadge({
  item,
}: {
  item: EquipmentItemWithCalculations;
}) {
  const { t } = useTranslation('hive');
  const {
    toPurchase = 0,
    total = 0,
    inUse = 0,
    extra = 0,
    inExtraction = 0,
  } = item;

  if (toPurchase > 0) {
    return (
      <Badge variant="destructive">
        {t('hive:equipment.table.need', { value: round2(toPurchase) })}
      </Badge>
    );
  }

  if (toPurchase === 0) {
    return <Badge variant="outline">{t('hive:equipment.table.exact')}</Badge>;
  }

  const surplus = round2(Math.abs(toPurchase));
  const breakdown = {
    total: round2(total),
    inUse: round2(inUse),
    stored: round2(extra),
  };

  return (
    <Tooltip>
      <TooltipTrigger className="cursor-help rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Badge variant="secondary">
          {t('hive:equipment.table.surplusBadge', { value: surplus })}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t('hive:equipment.table.surplusExtra', { value: surplus })}</p>
        <p className="text-xs text-muted-foreground">
          {inExtraction > 0
            ? t('hive:equipment.table.totalUsableWithExtracting', {
                ...breakdown,
                extracting: round2(inExtraction),
              })
            : t('hive:equipment.table.totalUsable', breakdown)}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
