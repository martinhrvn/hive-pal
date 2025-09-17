import { BarChart, CrownIcon } from 'lucide-react';
import { BeeIcon } from '@/components/common/bee-icon.tsx';
import { IconJarLogoIcon } from '@radix-ui/react-icons';
import { Card } from '@/components/ui/card';
import { HiveScore } from 'shared-schemas';

export const StatisticCards = ({ score }: { score: HiveScore }) => {
  const strength = score.populationScore;
  const honeyStores = score.storesScore;
  const queenScore = score.queenScore;

  const getScoreColor = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'text-muted-foreground';
    if (value >= 6) return 'text-green-600';
    if (value >= 3) return 'text-amber-500';
    return 'text-red-500';
  };

  const ScoreItem = ({
    title,
    value,
    icon,
    emphasized = false,
  }: {
    title: string;
    value: number | null | undefined;
    icon: React.ReactNode;
    emphasized?: boolean;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <div
          className={`${emphasized ? 'text-sm font-medium' : 'text-sm'} text-muted-foreground`}
        >
          {title}
        </div>
      </div>
      <div
        className={`${emphasized ? 'text-3xl' : 'text-2xl'} font-bold ${getScoreColor(value)}`}
      >
        {value?.toFixed(1) ?? '—'}
        <span className="text-sm font-normal text-muted-foreground"> / 10</span>
      </div>
    </div>
  );

  // Mobile compact view
  const MobileScoreItem = ({
    label,
    value,
  }: {
    label: string;
    value: number | null | undefined;
  }) => (
    <div className="flex items-baseline gap-1">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className={`text-sm font-semibold ${getScoreColor(value)}`}>
        {value?.toFixed(1) ?? '—'}
      </span>
    </div>
  );

  return (
    <Card className="p-3 sm:p-6">
      {/* Mobile view - single line */}
      <div className="sm:hidden flex items-center justify-between flex-wrap gap-2">
        <MobileScoreItem label="Overall" value={score.overallScore} />
        <MobileScoreItem label="Pop" value={strength} />
        <MobileScoreItem label="Stores" value={honeyStores} />
        <MobileScoreItem label="Queen" value={queenScore} />
      </div>

      {/* Desktop view - 2x2 grid */}
      <div className="hidden sm:block">
        <div className="h-full grid grid-cols-2 items-center justify-center">
          <ScoreItem
            title="Overall Score"
            value={score.overallScore}
            icon={<BarChart className="text-muted-foreground/60" />}
            emphasized
          />

          <ScoreItem
            title="Population"
            value={strength}
            icon={<BeeIcon className="text-muted-foreground/60" />}
            emphasized
          />
          <ScoreItem
            title="Stores"
            value={honeyStores}
            icon={<IconJarLogoIcon className="text-muted-foreground/60" />}
            emphasized
          />

          <ScoreItem
            title="Queen Score"
            value={queenScore}
            icon={<CrownIcon className="text-muted-foreground/60" />}
            emphasized
          />
        </div>
      </div>
    </Card>
  );
};
