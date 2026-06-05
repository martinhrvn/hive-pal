import { Beaker, Compass, Waypoints, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  MainContent,
  PageAside,
  PageGrid,
} from '@/components/layout/page-grid-layout';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SwarmMethodCard } from '@/components/common';
import {
  CalloutCard,
  DotList,
  ToolMeta,
  ToolPageHeader,
} from '@/components/tool-page';

export function SwarmManagementOverviewPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Honey Bee Swarm Management Methods',
        url: 'https://hivepal.app/tools/swarm-management',
        description:
          'Reference guides for honey bee swarm-control methods, including the Demaree method, with prerequisites, step-by-step procedures, and follow-up inspection timing.',
        isAccessibleForFree: true,
        publisher: {
          '@type': 'Organization',
          name: 'Hive Pal',
          url: 'https://hivepal.app',
        },
        hasPart: [
          {
            '@type': 'WebPage',
            name: 'Demaree Method',
            url: 'https://hivepal.app/tools/swarm-management/demaree',
            description:
              'Reference workflow for the Demaree swarm-control method with an inspection planner.',
          },
        ],
      },
    ],
  };

  const placeholders = [
    {
      key: 'pagden',
      title: t('swarmManagement.cards.pagden.title'),
      description: t('swarmManagement.cards.pagden.description'),
    },
    {
      key: 'artificialSwarm',
      title: t('swarmManagement.cards.artificialSwarm.title'),
      description: t('swarmManagement.cards.artificialSwarm.description'),
    },
  ];

  return (
    <PageGrid>
      <ToolMeta
        title="Honey Bee Swarm Management Methods — Hive Pal"
        description="Free reference guides for honey bee swarm-control methods. Compare the Demaree, Pagden, and artificial swarm techniques and plan follow-up inspections."
        ogDescription="Compare proven honey bee swarm-control methods and plan follow-up inspections."
        path="/tools/swarm-management"
        structuredData={structuredData}
      />

      <MainContent>
        <ToolPageHeader
          eyebrow={t('swarmManagement.eyebrow')}
          title={t('swarmManagement.title')}
          intro={t('swarmManagement.intro')}
        />

        <div className="space-y-4">
          <SwarmMethodCard
            title={t('swarmManagement.cards.demaree.title')}
            description={t('swarmManagement.cards.demaree.description')}
            detail={t('swarmManagement.cards.demaree.detail')}
            cta={t('swarmManagement.cards.demaree.cta')}
            icon={<Waypoints className="h-5 w-5 text-primary" />}
            badge={<Badge>{t('swarmManagement.cards.available')}</Badge>}
            className="border-primary/30 bg-primary/5"
            onClick={() => navigate('/tools/swarm-management/demaree')}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {placeholders.map(method => (
              <SwarmMethodCard
                key={method.key}
                title={method.title}
                description={method.description}
                cta={t('swarmManagement.cards.placeholderCta')}
                icon={<Beaker className="h-5 w-5 text-muted-foreground" />}
                badge={
                  <Badge variant="secondary">
                    {t('swarmManagement.cards.comingSoon')}
                  </Badge>
                }
                className="opacity-70"
                disabled
              />
            ))}
          </div>
        </div>
      </MainContent>

      <PageAside>
        <div className="space-y-4 md:sticky md:top-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Compass className="h-5 w-5 text-primary" />
                {t('swarmManagement.aside.title')}
              </CardTitle>
              <CardDescription>
                {t('swarmManagement.aside.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DotList
                items={[0, 1, 2].map(i =>
                  t(`swarmManagement.aside.points.${i}`),
                )}
              />
            </CardContent>
          </Card>

          <CalloutCard
            variant="amber"
            icon={<AlertTriangle className="h-5 w-5" />}
            title={t('swarmManagement.aside.criticalTimingTitle')}
          >
            <p>{t('swarmManagement.aside.criticalTimingLead')}</p>
            <p>{t('swarmManagement.aside.criticalTimingDetail')}</p>
          </CalloutCard>
        </div>
      </PageAside>
    </PageGrid>
  );
}
