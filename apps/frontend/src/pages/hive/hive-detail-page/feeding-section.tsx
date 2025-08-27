import { useActions, useHive } from '@/api/hooks';
import { Section } from '@/components/common/section';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateFeedingTotals } from '@/utils/feeding-calculations';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ActionType } from 'shared-schemas';

interface FeedingSectionProps {
  hiveId: string;
}

export const FeedingSection: React.FC<FeedingSectionProps> = ({ hiveId }) => {
  const { data: actions, isLoading } = useActions(
    hiveId ? { hiveId, type: ActionType.FEEDING } : undefined,
    {
      enabled: !!hiveId,
    },
  );
  const { data: hive } = useHive(hiveId);

  if (!hiveId || isLoading) {
    return (
      <Section title="Feeding">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </Card>
          ))}
        </div>
      </Section>
    );
  }

  if (!actions || actions.length === 0) {
    return (
      <Section title="Feeding">
        <Card className="p-6 text-center text-muted-foreground">
          No feeding records found for this hive
        </Card>
      </Section>
    );
  }

  const totals = calculateFeedingTotals(actions, hive?.settings);
  const currentMonth = new Date().getMonth() + 1;
  const isAfterAugust = currentMonth >= 8;

  return (
    <Section title="Feeding">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Feeding Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Feeding
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>All-time feeding totals for this hive</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">
              {totals.totalSugarKg.toFixed(2)} kg
            </div>
            <div className="text-xs text-muted-foreground">Total Sugar</div>
            {totals.totalSyrupLiters > 0 && (
              <div className="text-sm text-muted-foreground">
                {totals.totalSyrupLiters.toFixed(1)} L syrup
              </div>
            )}
          </div>
        </Card>

        {/* Current Year Feeding Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              {new Date().getFullYear()} Total
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total feeding for the current year</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">
              {totals.currentYearSugarKg.toFixed(2)} kg
            </div>
            <div className="text-xs text-muted-foreground">Sugar this year</div>
            {totals.currentYearSyrupLiters > 0 && (
              <div className="text-sm text-muted-foreground">
                {totals.currentYearSyrupLiters.toFixed(1)} L syrup
              </div>
            )}
          </div>
        </Card>

        {/* Autumn Feeding Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Autumn Feeding
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isAfterAugust
                      ? 'Feeding since August this year'
                      : 'Feeding from last August onwards'}
                  </p>
                  <p className="text-xs mt-1">
                    Sugar calculations: 1:1 = 660g/L, 2:1 = 890g/L, 3:2 = 750g/L
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">
              {totals.autumnSugarKg.toFixed(2)} kg
            </div>
            <div className="text-xs text-muted-foreground">
              Sugar since August
            </div>
            {totals.autumnSyrupLiters > 0 && (
              <div className="text-sm text-muted-foreground">
                {totals.autumnSyrupLiters.toFixed(1)} L syrup
              </div>
            )}
          </div>
        </Card>
      </div>
    </Section>
  );
};
