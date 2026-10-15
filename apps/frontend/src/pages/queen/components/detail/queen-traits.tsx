import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { QUEEN_TRAITS, type QueenDetail } from 'shared-schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RatingMeter } from '../trait-rating';

/** Rated traits only; renders nothing when none is rated. */
export const QueenTraits = ({ queen }: { queen: QueenDetail }) => {
  const { t } = useTranslation('queen');
  const rated = QUEEN_TRAITS.flatMap(trait => {
    const value = queen[trait];
    return value == null ? [] : [{ trait, value }];
  });
  if (rated.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="size-4 text-muted-foreground" />
          {t('sections.traits')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          {rated.map(({ trait, value }) => (
            <div
              key={trait}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1"
            >
              <dt className="text-sm font-medium">{t(`traits.${trait}`)}</dt>
              <dd>
                <RatingMeter value={value} />
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
};
