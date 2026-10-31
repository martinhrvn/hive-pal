import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { QueenDetail } from 'shared-schemas';
import {
  EditorialCard,
  EditorialCardBody,
  EditorialCardHeader,
  EditorialCardOverline,
  EditorialCardStrip,
  EditorialCardTitle,
} from '@/components/common/editorial-card';
import { StatusPill } from '@/components/common/status-pill';
import { useDateFormat } from '@/hooks/use-date-format';
import {
  QUEEN_STATUS_TONE,
  getQueenColorClass,
  getQueenDisplayName,
  queenStatusLabelKey,
} from '@/lib/queen-utils';
import { cn } from '@/lib/utils';
import { QueenFacts } from './queen-facts';
import { VirginQueenNotice } from './virgin-queen-notice';

/** Editorial header, matching the hive page: name, facts and her hive. */
export const QueenDetailHeader = ({ queen }: { queen: QueenDetail }) => {
  const { t } = useTranslation('queen');
  const { formatDate } = useDateFormat();
  const notes = queen.notes?.trim();

  return (
    <EditorialCard>
      <EditorialCardBody>
        <EditorialCardHeader>
          <EditorialCardOverline
            trailing={
              queen.status && (
                <StatusPill tone={QUEEN_STATUS_TONE[queen.status]}>
                  {t(queenStatusLabelKey(queen.status))}
                </StatusPill>
              )
            }
          >
            {queen.installedAt
              ? t('detail.installedOn', { date: formatDate(queen.installedAt) })
              : t('detail.overline')}
          </EditorialCardOverline>
          <div className="mt-1.5 flex items-center gap-3">
            <span
              aria-hidden
              className={cn(
                'size-6 shrink-0 rounded-full border border-border @sm/editorial:size-7',
                getQueenColorClass(queen.color),
              )}
            />
            <EditorialCardTitle className="mt-0">
              {getQueenDisplayName(t, queen)}
            </EditorialCardTitle>
          </div>
          {notes && (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
              {notes}
            </p>
          )}
          <VirginQueenNotice queen={queen} className="mt-3" />
        </EditorialCardHeader>

        <QueenFacts queen={queen} />

        <EditorialCardStrip muted className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {t('fields.hive')}
          </span>
          {queen.hiveId && queen.hiveName ? (
            <Link
              to={`/hives/${queen.hiveId}`}
              className="rounded-sm text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {queen.hiveName}
            </Link>
          ) : (
            <span className="text-sm italic text-muted-foreground">
              {t('detail.notInHive')}
            </span>
          )}
        </EditorialCardStrip>
      </EditorialCardBody>
    </EditorialCard>
  );
};
