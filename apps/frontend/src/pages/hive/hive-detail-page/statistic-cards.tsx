import { InspectionScoreDto } from 'api-client';
import { BarChart, CrownIcon } from 'lucide-react';
import { BeeIcon } from '@/components/common/bee-icon.tsx';
import { IconJarLogoIcon } from '@radix-ui/react-icons';

type StatisticCardProps = {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  emphasized?: boolean;
};

const StatisticCard = ({
  title,
  value,
  icon,
  emphasized,
}: StatisticCardProps) => {
  return (
    <div
      className={`flex border shadow-sm px-8 py-4 rounded-md items-center justify-center hover:bg-amber-100 gap-8 ${emphasized ? 'border-amber-400 bg-amber-50 shadow-lg' : ''}`}
    >
      <div>{icon}</div>
      <div className={'flex flex-col justify-end'}>
        <span className={'text-sm text text-muted-foreground'}> {title}</span>
        <div className={'wrap-none'}>
          {' '}
          <span className={'text-4xl font-bold'}>{value}</span>
          <span className={'text-sm text-muted-foreground/80'}> / 10</span>
        </div>
      </div>
    </div>
  );
};

export const StatisticCards = ({ score }: { score: InspectionScoreDto }) => {
  // Find most recent values for each metric
  let strength: number | null = score.populationScore;
  let honeyStores: number | null = score.storesScore;
  let queenScore: number | null = score.queenScore;

  // Create color classes based on values
  const getStrengthColor = (value: number | null) => {
    if (value === null) return '';
    if (value >= 7) return 'text-green-600';
    if (value >= 4) return 'text-amber-500';
    return 'text-red-500';
  };

  const getHoneyColor = (value: number | null) => {
    if (value === null) return '';
    if (value >= 7) return 'text-green-600';
    if (value >= 3) return 'text-amber-500';
    return 'text-red-500';
  };

  const getQueenColor = (value: number | null) => {
    if (value === null) return '';
    if (value >= 6) return 'text-green-600';
    if (value >= 3) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="grid md:grid-cols-3 grid-cols-1 gap-4 my-5">
      <div className={'md:col-span-3'}>
        <StatisticCard
          title="Overall score"
          emphasized
          value={
            <span className={getStrengthColor(strength)}>
              {score.overallScore !== null
                ? score.overallScore.toFixed(1)
                : '—'}
            </span>
          }
          subtitle={''}
          icon={<BarChart className="h-8 w-8 " />}
        />
      </div>

      <StatisticCard
        title="Population score"
        value={
          <span className={getStrengthColor(strength)}>
            {strength !== null ? strength.toFixed(1) : '—'}
          </span>
        }
        subtitle={''}
        icon={<BeeIcon className="h-8 w-8  text-muted-foreground/60" />}
      />
      <StatisticCard
        title="Stores score"
        value={
          <span className={getHoneyColor(honeyStores)}>
            {honeyStores !== null ? honeyStores.toFixed(1) : '—'}
          </span>
        }
        subtitle={''}
        icon={<IconJarLogoIcon className="h-8 w-8  text-muted-foreground/60" />}
      />
      <StatisticCard
        title="Queen score"
        value={
          <span className={getQueenColor(honeyStores)}>
            {queenScore !== null ? queenScore.toFixed(1) : '—'}
          </span>
        }
        subtitle={''}
        icon={<CrownIcon className="h-8 w-8 text-muted-foreground/80" />}
      />
    </div>
  );
};
