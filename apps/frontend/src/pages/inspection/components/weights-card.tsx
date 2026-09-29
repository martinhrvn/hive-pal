import { Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InspectionSection } from './inspection-section';
import { useUnitFormat } from '@/hooks/use-unit-format';
import type { WeightReadingResponse, Box, MeasurementSide } from 'shared-schemas';

type WeightsCardProps = {
  weights?: WeightReadingResponse[] | null;
  hiveBoxes?: Box[];
};

export const WeightsCard = ({ weights, hiveBoxes = [] }: WeightsCardProps) => {
  const { t } = useTranslation('inspection');
  const { formatWeight } = useUnitFormat();

  if (!weights || weights.length === 0) return null;

  const boxById = new Map(
    hiveBoxes
      .filter((b): b is Box & { id: string } => typeof b.id === 'string')
      .map(b => [b.id, b] as const),
  );

  const positionLabel = (boxId: string | null): string => {
    const box = boxId ? boxById.get(boxId) : undefined;
    if (!box) return t('form.weights.wholeHive');
    return t('form.weights.boxLabel', {
      position: box.position + 1,
      type: t(`form.weights.boxType.${box.type}`, box.type),
    });
  };

  const sideLabel = (side: MeasurementSide | null): string =>
    side ? t(`form.weights.sides.${side}`) : t('form.weights.wholeWeight');

  return (
    <InspectionSection
      title={t('form.weights.title')}
      icon={<Scale className="h-4 w-4" />}
    >
      <ul className="divide-y divide-border">
        {weights.map(w => (
          <li key={w.id} className="flex items-center justify-between py-2">
            <span className="text-sm text-stone-600 dark:text-stone-400">
              {positionLabel(w.boxId)} · {sideLabel(w.side)}
            </span>
            <span className="font-medium tabular-nums">
              {formatWeight(w.value).label}
            </span>
          </li>
        ))}
      </ul>
    </InspectionSection>
  );
};
