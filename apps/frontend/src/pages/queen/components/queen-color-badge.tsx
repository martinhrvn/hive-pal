import { getQueenColorClass } from '@/lib/queen-utils';

type QueenColorBadgeProps = {
  color: string | null | undefined;
};

export const QueenColorBadge: React.FC<QueenColorBadgeProps> = ({ color }) => {
  if (!color) return null;
  const colorClass = getQueenColorClass(color);
  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-4 w-4 rounded-full border border-gray-400 ${colorClass}`}
      />
      <span className="capitalize text-sm">{color}</span>
    </div>
  );
};
