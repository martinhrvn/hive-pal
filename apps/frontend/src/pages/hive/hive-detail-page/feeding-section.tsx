import { useActions, useHive } from '@/api/hooks';
import { Section } from '@/components/common/section';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { calculateFeedingTotals } from '@/utils/feeding-calculations';
import { Info, Target } from 'lucide-react';
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
      <Card className="p-6 text-center text-muted-foreground">
        No feeding records found for this hive
      </Card>
    );
  }

  const totals = calculateFeedingTotals(actions, hive?.settings);
  const currentMonth = new Date().getMonth() + 1;
  const isAfterAugust = currentMonth >= 8;

  // Calculate feeding progress based on hive settings
  const targetAmount = hive?.settings?.autumnFeeding?.amountKg || 12;
  const currentAmount = totals.autumnSugarKg;
  const progressPercentage = Math.min(
    (currentAmount / targetAmount) * 100,
    100,
  );
  const remainingAmount = Math.max(targetAmount - currentAmount, 0);

  return (
    <Card className="p-6">
      <div className="space-y-8">
        {/* Total and Autumn Feeding in 2 columns */}
        <div className="grid grid-cols-2 gap-6">
          {/* Current Year Feeding */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {new Date().getFullYear()} Total
              </div>
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
            <div className="text-3xl font-bold">
              {totals.currentYearSugarKg.toFixed(2)} kg
            </div>
            {totals.currentYearSyrupLiters > 0 && (
              <div className="text-xs text-muted-foreground">
                {totals.currentYearSyrupLiters.toFixed(1)}L syrup
              </div>
            )}
          </div>

          {/* Autumn Feeding */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Autumn Feeding
              </div>
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
                      Sugar calculations: 1:1 = 660g/L, 2:1 = 890g/L, 3:2 =
                      750g/L
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-3xl font-bold">
              {totals.autumnSugarKg.toFixed(2)} kg
            </div>
            {totals.autumnSyrupLiters > 0 && (
              <div className="text-xs text-muted-foreground">
                {totals.autumnSyrupLiters.toFixed(1)}L syrup
              </div>
            )}
          </div>
        </div>

        {/* Feeding Progress */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">Target Progress</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Progress towards autumn feeding target</p>
                  <p className="text-xs mt-1">
                    Target: {targetAmount} kg sugar equivalent
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-3xl font-bold">
            {progressPercentage.toFixed(0)}%
          </div>
          <div className="text-sm text-muted-foreground">
            {currentAmount.toFixed(2)} / {targetAmount} kg
          </div>
          <Progress
            value={progressPercentage}
            className="h-2"
            color={
              progressPercentage >= 100
                ? 'bg-green-500'
                : progressPercentage >= 75
                  ? 'bg-blue-500'
                  : 'bg-orange-500'
            }
          />
          {remainingAmount > 0 && (
            <div className="text-xs text-muted-foreground">
              {remainingAmount.toFixed(2)} kg remaining
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
