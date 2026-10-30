import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { BarChart, CrownIcon } from 'lucide-react';
import { BeeIcon } from '@/components/common/bee-icon.tsx';
import { IconJarLogoIcon } from '@radix-ui/react-icons';
import { Card } from '@/components/ui/card';
import { HiveScore } from 'shared-schemas';
import { getScoreLevelTextClass } from '@/lib/score-level';
import { ScoreLevelCue } from '@/components/common/score-level-cue';

type ScoreItemProps = {
  title: string;
  value: number | null | undefined;
  icon: ReactNode;
};

const ScoreItem = ({ title, value, icon }: ScoreItemProps) => {
  const { t } = useTranslation('hive');
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
      </div>
      <div
        className={`flex items-baseline gap-1.5 text-3xl font-bold ${getScoreLevelTextClass(value)}`}
      >
        <ScoreLevelCue value={value} iconClassName="size-4" />
        <span>{value?.toFixed(1) ?? '—'}</span>
        <span className="text-sm font-normal text-muted-foreground">
          {t('scores.outOfTen')}
        </span>
      </div>
    </div>
  );
};

type MobileScoreItemProps = {
  label: string;
  value: number | null | undefined;
};

const MobileScoreItem = ({ label, value }: MobileScoreItemProps) => (
  <div className="flex items-center gap-1">
    <span className="text-xs text-muted-foreground">{label}:</span>
    <span
      className={`inline-flex items-center gap-1 text-sm font-semibold ${getScoreLevelTextClass(value)}`}
    >
      <ScoreLevelCue value={value} iconClassName="size-3" />
      {value?.toFixed(1) ?? '—'}
    </span>
  </div>
);

type CompactScoreItemProps = {
  title: string;
  value: number | null | undefined;
  icon: ReactNode;
};

const CompactScoreItem = ({ title, value, icon }: CompactScoreItemProps) => {
  const { t } = useTranslation('hive');
  return (
    <div>
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-xs text-muted-foreground">{title}</span>
      </div>
      <div
        className={`flex items-baseline gap-1.5 text-xl font-bold ${getScoreLevelTextClass(value)}`}
      >
        <ScoreLevelCue value={value} />
        <span>{value?.toFixed(1) ?? '—'}</span>
        <span className="text-sm font-normal text-muted-foreground">
          {t('scores.outOfTen')}
        </span>
      </div>
    </div>
  );
};

export const StatisticCards = ({
  score,
  variant = 'card',
}: {
  score: HiveScore;
  variant?: 'card' | 'inline';
}) => {
  const { t } = useTranslation(['hive']);
  const strength = score.populationScore;
  const honeyStores = score.storesScore;
  const queenScore = score.queenScore;

  const mobileView = (
    <div className="sm:hidden flex items-center justify-between flex-wrap gap-2">
      <MobileScoreItem
        label={t('hive:scores.overall')}
        value={score.overallScore}
      />
      <MobileScoreItem
        label={t('hive:scores.populationShort')}
        value={strength}
      />
      <MobileScoreItem label={t('hive:scores.stores')} value={honeyStores} />
      <MobileScoreItem label={t('hive:scores.queen')} value={queenScore} />
    </div>
  );

  if (variant === 'inline') {
    return (
      <div>
        {mobileView}
        <div className="hidden sm:grid grid-cols-4 gap-2">
          <CompactScoreItem
            title={t('hive:scores.overallScore')}
            value={score.overallScore}
            icon={<BarChart className="size-3.5 text-muted-foreground/60" />}
          />
          <CompactScoreItem
            title={t('hive:scores.population')}
            value={strength}
            icon={<BeeIcon className="size-3.5 text-muted-foreground/60" />}
          />
          <CompactScoreItem
            title={t('hive:scores.stores')}
            value={honeyStores}
            icon={
              <IconJarLogoIcon className="size-3.5 text-muted-foreground/60" />
            }
          />
          <CompactScoreItem
            title={t('hive:scores.queenScore')}
            value={queenScore}
            icon={<CrownIcon className="size-3.5 text-muted-foreground/60" />}
          />
        </div>
      </div>
    );
  }

  return (
    <Card className="p-3 sm:p-6">
      {mobileView}

      {/* Desktop view - 2x2 grid */}
      <div className="hidden sm:block">
        <div className="h-full grid grid-cols-2 items-center justify-center">
          <ScoreItem
            title={t('hive:scores.overallScore')}
            value={score.overallScore}
            icon={<BarChart className="size-6 text-muted-foreground/60" />}
          />

          <ScoreItem
            title={t('hive:scores.population')}
            value={strength}
            icon={<BeeIcon className="size-6 text-muted-foreground/60" />}
          />
          <ScoreItem
            title={t('hive:scores.stores')}
            value={honeyStores}
            icon={
              <IconJarLogoIcon className="size-6 text-muted-foreground/60" />
            }
          />

          <ScoreItem
            title={t('hive:scores.queenScore')}
            value={queenScore}
            icon={<CrownIcon className="size-6 text-muted-foreground/60" />}
          />
        </div>
      </div>
    </Card>
  );
};
