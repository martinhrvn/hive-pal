import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { GitBranch, Plus } from 'lucide-react';
import type { QueenDetail } from 'shared-schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QueenRefLink } from './queen-ref-link';

export const QueenLineage = ({
  queen,
  canEdit,
}: {
  queen: QueenDetail;
  canEdit: boolean;
}) => {
  const { t } = useTranslation('queen');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="size-4 text-muted-foreground" />
          {t('sections.lineage')}
        </CardTitle>
        {canEdit && (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/queens/create?motherQueenId=${queen.id}`}>
              <Plus className="size-4" />
              {t('detail.addDaughter')}
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {queen.motherQueen && (
          <div className="space-y-1">
            <h3 className="font-overline text-muted-foreground">
              {t('detail.mother')}
            </h3>
            <QueenRefLink queen={queen.motherQueen} />
          </div>
        )}
        <div className="space-y-1">
          <h3 className="font-overline text-muted-foreground">
            {t('detail.daughters')}
          </h3>
          {queen.daughters.length > 0 ? (
            <ul>
              {queen.daughters.map(daughter => (
                <li key={daughter.id}>
                  <QueenRefLink queen={daughter} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-2 text-sm text-muted-foreground">
              {t('detail.noDaughters')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
