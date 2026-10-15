import { Card } from '@/components/ui/card';
import { HiveWithBoxesResponse } from 'shared-schemas';
import { cn } from '@/lib/utils';
import { Snowflake } from 'lucide-react';
import { AlertsPopover } from '@/components/alerts';
import { HiveScoreIndicator } from '@/components/hive';
import { BoxStack } from '@/components/hive/box-stack';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '@/hooks/use-date-format';

interface HiveCardProps {
  hive: HiveWithBoxesResponse;
  isSubjective?: boolean;
  isDragging?: boolean;
  className?: string;
}

export const HiveCard = ({
  hive,
  isSubjective = false,
  isDragging,
  className,
}: HiveCardProps) => {
  const { t } = useTranslation('hive');
  const { formatDate } = useDateFormat();
  const isWinterized = hive.boxes?.some(box => box.winterized) ?? false;

  return (
    <Card
      className={cn(
        'cursor-move hover:shadow-md transition-shadow min-w-[140px] max-w-[180px] overflow-hidden',
        isDragging && 'opacity-50',
        className,
      )}
    >
      {/* Header with hive info */}
      <div className="space-y-0.5 px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0">
            {isWinterized && (
              <Snowflake className="size-3.5 shrink-0 text-info drop-shadow-sm" />
            )}
            <h4 className="font-medium text-sm truncate">{hive.name}</h4>
          </div>
          <HiveScoreIndicator
            status={hive.status}
            score={
              (isSubjective
                ? hive.lastInspectionOverallScore
                : hive.lastInspectionStrength) ?? null
            }
            inspectionType={isSubjective ? 'subjective' : 'data_driven'}
            strength={hive.lastInspectionStrength}
            totalFrames={hive.lastInspectionTotalFrames}
          />
        </div>

        {hive.lastInspectionDate && (
          <p className="truncate text-xs text-muted-foreground">
            {t('card.lastInspected', {
              date: formatDate(hive.lastInspectionDate),
            })}
          </p>
        )}

        {/* Alerts with popover */}
        <AlertsPopover alerts={hive.alerts || []} />
      </div>

      <div className="px-2">
        <BoxStack boxes={hive.boxes} size="card" />
      </div>
    </Card>
  );
};
