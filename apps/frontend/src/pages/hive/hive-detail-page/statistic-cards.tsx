import { BarChart, CrownIcon } from 'lucide-react';
import { BeeIcon } from '@/components/common/bee-icon.tsx';
import { IconJarLogoIcon } from '@radix-ui/react-icons';
import { StatisticCard } from '@/components/common/staticstic-card.tsx';
import { HiveScore } from 'shared-schemas';

export const StatisticCards = ({ score }: { score: HiveScore }) => {
  const strength = score.populationScore;
  const honeyStores = score.storesScore;
  const queenScore = score.queenScore;

  const getScoreColor = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '';
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
              {score.overallScore?.toFixed(1) ?? '—'}
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
            {strength?.toFixed(1) ?? '—'}
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
            {honeyStores?.toFixed(1) ?? '—'}
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
            {queenScore?.toFixed(1) ?? '—'}
          </span>
        }
        subtitle={''}
        afterValue={' / 10'}
        icon={<CrownIcon className="h-8 w-8 text-muted-foreground/80" />}
      />
    </div>
  );
};
