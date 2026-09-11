import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Split, Sprout } from 'lucide-react';
import type { HiveDetailResponse } from 'shared-schemas';
import { cn } from '@/lib/utils';

/**
 * Split provenance badges shown under the hive name: where a hive was split
 * from (its mother) and which hives were split off from it (its offspring).
 * An optional origin marker — hidden entirely when the hive has neither.
 */
export const HiveProvenance = ({ hive }: { hive: HiveDetailResponse }) => {
  const { t } = useTranslation('hive');
  const parent = hive.parentHive;
  const offspring = hive.offspring ?? [];

  if (!parent && offspring.length === 0) return null;

  const chip =
    'inline-flex items-center gap-1 rounded-full border border-teal-200 dark:border-teal-900/60 ' +
    'bg-teal-50/70 dark:bg-teal-950/30 px-2 py-0.5 text-xs text-teal-800 dark:text-teal-200 ' +
    'transition-colors hover:bg-teal-100/80 dark:hover:bg-teal-900/40';

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
      {parent && (
        <Link
          to={`/hives/${parent.id}`}
          className={chip}
          title={t('split.provenanceFromTitle', {
            defaultValue: 'This hive was split from {{name}}',
            name: parent.name,
          })}
        >
          <Split className="h-3 w-3 shrink-0" />
          <span className="text-teal-600/90 dark:text-teal-300/80">
            {t('split.provenanceFrom', { defaultValue: 'Split from' })}
          </span>
          <span className="font-medium">{parent.name}</span>
        </Link>
      )}

      {offspring.length > 0 && (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
            <Sprout className="h-3 w-3 shrink-0" />
            {t('split.provenanceOffspring', { defaultValue: 'Offspring' })}:
          </span>
          {offspring.map((child) => (
            <Link
              key={child.id}
              to={`/hives/${child.id}`}
              className={cn(
                chip,
                child.status === 'ARCHIVED' && 'opacity-60',
              )}
            >
              <span className="font-medium">{child.name}</span>
            </Link>
          ))}
        </span>
      )}
    </div>
  );
};
