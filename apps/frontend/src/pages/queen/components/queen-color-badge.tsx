import { useTranslation } from 'react-i18next';
import { getQueenColorClass } from '@/lib/queen-utils';
import { cn } from '@/lib/utils';

type QueenColorBadgeProps = {
  color: string | null | undefined;
};

export const QueenColorBadge: React.FC<QueenColorBadgeProps> = ({ color }) => {
  const { t } = useTranslation('queen');
  if (!color) return null;
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          'size-4 rounded-full border border-border',
          getQueenColorClass(color),
        )}
      />
      <span className="text-sm">
        {t(`colors.${color.toLowerCase()}`, { defaultValue: color })}
      </span>
    </span>
  );
};
