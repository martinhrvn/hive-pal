import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSharedResource } from '@/api/hooks/useShares';
import { ShareResourceType } from 'shared-schemas';
import { useTranslation } from 'react-i18next';

// Unit symbol shown when a shared harvest hive has no unit recorded.
const DEFAULT_HONEY_UNIT = 'kg';

export function SharedPage() {
  const { t, i18n } = useTranslation('share');
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useSharedResource(token ?? '');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">
              {t('shared.notFound.title')}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t('shared.notFound.description')}
            </p>
            <Link to="/register">
              <Button>{t('shared.notFound.signUp')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isHarvest = data.resourceType === ShareResourceType.HARVEST;
  const dateStr = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'long',
  }).format(new Date(data.date));

  const ogTitle = isHarvest
    ? t('shared.og.harvestTitle', {
        amount: data.totalWeight
          ? `${data.totalWeight} ${data.totalWeightUnit}`
          : t('shared.harvest.inProgress'),
      })
    : t('shared.og.inspectionTitle', { hiveName: data.hiveName });

  const ogDescription = isHarvest
    ? `${data.apiaryName} - ${dateStr}`
    : `${dateStr}${data.temperature ? ` - ${data.temperature}°C` : ''}`;

  const imageUrl = token
    ? `${window.location.origin}/api/shares/${token}/image`
    : undefined;

  return (
    <>
      <title>{t('shared.pageTitle', { title: ogTitle })}</title>
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      <meta property="og:type" content="website" />

      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <header className="bg-background border-b px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold">
              <img
                src="/hive-pal-logo.png"
                alt={t('shared.brand')}
                className="w-8 h-8"
              />
              {t('shared.brand')}
            </Link>
            <Link to="/register">
              <Button size="sm">{t('shared.signUpFree')}</Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {isHarvest ? (
            <HarvestView data={data} dateStr={dateStr} />
          ) : (
            <InspectionView data={data} dateStr={dateStr} />
          )}

          {/* CTA */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-semibold mb-2">
                {t('shared.cta.title')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('shared.cta.description')}
              </p>
              <Link to="/register">
                <Button>{t('shared.signUpFree')}</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}

function HarvestView({
  data,
  dateStr,
}: {
  data: Extract<
    ReturnType<typeof useSharedResource>['data'],
    { resourceType: 'HARVEST' }
  > &
    Record<string, unknown>;
  dateStr: string;
}) {
  const { t } = useTranslation('share');
  const harvest = data as {
    resourceType: 'HARVEST';
    date: string;
    totalWeight: number | null;
    totalWeightUnit: string;
    status: string;
    apiaryName: string;
    harvestHives: Array<{
      hiveName: string;
      framesTaken: number;
      honeyAmount: number | null;
      honeyAmountUnit?: string;
    }>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {t('shared.harvest.title')}
            </CardTitle>
            <Badge variant="outline">{harvest.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('shared.harvest.date')}
              </p>
              <p className="font-medium">{dateStr}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('shared.harvest.apiary')}
              </p>
              <p className="font-medium">{harvest.apiaryName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('shared.harvest.totalWeight')}
              </p>
              <p className="text-xl font-bold">
                {harvest.totalWeight
                  ? `${harvest.totalWeight} ${harvest.totalWeightUnit}`
                  : t('shared.harvest.inProgress')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('shared.harvest.hives')}
              </p>
              <p className="font-medium">{harvest.harvestHives.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('shared.harvest.breakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {harvest.harvestHives.map((hh, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{hh.hiveName}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('shared.harvest.frames', { count: hh.framesTaken })}
                  </p>
                </div>
                {hh.honeyAmount && (
                  <p className="font-medium">
                    {hh.honeyAmount} {hh.honeyAmountUnit || DEFAULT_HONEY_UNIT}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function InspectionView({
  data,
  dateStr,
}: {
  data: Record<string, unknown>;
  dateStr: string;
}) {
  const { t } = useTranslation(['share', 'inspection']);
  const inspection = data as {
    resourceType: 'INSPECTION';
    date: string;
    hiveName: string;
    temperature: number | null;
    weatherConditions: string | null;
    observations: Array<{
      type: string;
      numericValue?: number | null;
      textValue?: string | null;
      booleanValue?: boolean | null;
    }>;
    scores: {
      overallScore: number | null;
      populationScore: number | null;
      storesScore: number | null;
      queenScore: number | null;
    } | null;
    notes: string[];
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {t('shared.inspection.title', { hiveName: inspection.hiveName })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('shared.inspection.date')}
              </p>
              <p className="font-medium">{dateStr}</p>
            </div>
            {inspection.temperature !== null && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('shared.inspection.temperature')}
                </p>
                <p className="font-medium">
                  {t('inspection:units.celsius', {
                    value: inspection.temperature,
                  })}
                </p>
              </div>
            )}
            {inspection.weatherConditions && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('shared.inspection.weather')}
                </p>
                <p className="font-medium">{inspection.weatherConditions}</p>
              </div>
            )}
          </div>

          {/* Score cards */}
          {inspection.scores && (
            <div className="grid grid-cols-4 gap-3">
              {[
                {
                  label: t('inspection:scores.overall'),
                  value: inspection.scores.overallScore,
                },
                {
                  label: t('inspection:scores.population'),
                  value: inspection.scores.populationScore,
                },
                {
                  label: t('inspection:scores.stores'),
                  value: inspection.scores.storesScore,
                },
                {
                  label: t('inspection:scores.queen'),
                  value: inspection.scores.queenScore,
                },
              ]
                .filter(s => s.value !== null)
                .map(s => (
                  <div
                    key={s.label}
                    className="text-center p-3 rounded-lg bg-muted/50"
                  >
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-bold">
                      {Math.round(s.value! * 10) / 10}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {inspection.observations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('shared.inspection.observations')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {inspection.observations.map((obs, i) => (
                <div key={i} className="p-3 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {obs.type.replace(/_/g, ' ')}
                  </p>
                  <p className="font-medium">
                    {obs.booleanValue !== null && obs.booleanValue !== undefined
                      ? obs.booleanValue
                        ? t('shared.inspection.yes')
                        : t('shared.inspection.no')
                      : obs.numericValue !== null &&
                          obs.numericValue !== undefined
                        ? obs.numericValue
                        : obs.textValue || '-'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {inspection.notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('shared.inspection.notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {inspection.notes.map((note, i) => (
                <li key={i} className="text-sm">
                  {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
