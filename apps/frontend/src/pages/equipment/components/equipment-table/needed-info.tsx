import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { round2 } from './equipment-utils';

/** Info icon explaining how the "needed" amount is derived. */
export function NeededInfo({
  recommended,
  note,
}: Readonly<{
  recommended: number;
  /** Second line: where the recommendation comes from. */
  note: string;
}>) {
  const { t } = useTranslation('hive');

  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={t('hive:equipment.table.neededInfo')}
        className="rounded-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {t('hive:equipment.table.recommended', {
            value: round2(recommended),
          })}
        </p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </TooltipContent>
    </Tooltip>
  );
}
