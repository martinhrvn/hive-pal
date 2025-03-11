import { InspectionScoreDto } from 'api-client';
import { BarChart, CrownIcon } from 'lucide-react';
import { BeeIcon } from '@/components/common/bee-icon.tsx';
import { IconJarLogoIcon } from '@radix-ui/react-icons';
import { StatisticCard } from '@/components/common/staticstic-card.tsx';

export const StatisticCards = ({ score }: { score: InspectionScoreDto }) => {
  let strength: number | null = score.populationScore;
  let honeyStores: number | null = score.storesScore;
  let queenScore: number | null = score.queenScore;

  const getScoreColor = (value: number | null) => {
    if (value === null) return '';
    if (value >= 6) return 'text-green-600';
    if (value >= 3) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-wrap gap-4 my-5">
      <div className={'md:col-span-3'}>
        <StatisticCard
          title="Overall score"
          emphasized
          value={
            <span className={getScoreColor(strength)}>
              {score.overallScore !== null
                ? score.overallScore.toFixed(1)
                : '—'}
            </span>
          }
          subtitle={''}
          afterValue={' / 10'}
          icon={<BarChart className="h-8 w-8 " />}
        />
      </div>

      <StatisticCard
        title="Population score"
        value={
          <span className={getScoreColor(strength)}>
            {strength !== null ? strength.toFixed(1) : '—'}
          </span>
        }
        subtitle={''}
        afterValue={' / 10'}
        icon={<BeeIcon className="h-8 w-8  text-muted-foreground/60" />}
      />
      <StatisticCard
        title="Stores score"
        value={
          <span className={getScoreColor(honeyStores)}>
            {honeyStores !== null ? honeyStores.toFixed(1) : '—'}
          </span>
        }
        subtitle={''}
        afterValue={' / 10'}
        icon={<IconJarLogoIcon className="h-8 w-8  text-muted-foreground/60" />}
      />
      <StatisticCard
        title="Queen score"
        value={
          <span className={getScoreColor(honeyStores)}>
            {queenScore !== null ? queenScore.toFixed(1) : '—'}
          </span>
        }
        subtitle={''}
        afterValue={' / 10'}
        icon={<CrownIcon className="h-8 w-8 text-muted-foreground/80" />}
      />
    </div>
  );
};
