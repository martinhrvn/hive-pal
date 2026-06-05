import { Beaker, Waypoints } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  MainContent,
  PageGrid,
} from '@/components/layout/page-grid-layout';
import { Badge } from '@/components/ui/badge';
import { SwarmMethodCard } from '@/components/common';

export function SwarmManagementOverviewPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const methods = [
    {
      key: 'demaree',
      title: t('swarmManagement.cards.demaree.title'),
      description: t('swarmManagement.cards.demaree.description'),
      detail: t('swarmManagement.cards.demaree.detail'),
      cta: t('swarmManagement.cards.demaree.cta'),
      icon: <Waypoints className="h-5 w-5 text-primary" />,
      badge: <Badge>{t('swarmManagement.cards.available')}</Badge>,
      className: 'border-primary/30 bg-primary/5 lg:col-span-1',
      onClick: () => navigate('/tools/swarm-management/demaree'),
      disabled: false,
    },
    {
      key: 'pagden',
      title: t('swarmManagement.cards.pagden.title'),
      description: t('swarmManagement.cards.pagden.description'),
      cta: t('swarmManagement.cards.placeholderCta'),
      icon: <Beaker className="h-5 w-5 text-muted-foreground" />,
      badge: <Badge variant="secondary">{t('swarmManagement.cards.comingSoon')}</Badge>,
      className: 'opacity-70',
      disabled: true,
    },
    {
      key: 'artificialSwarm',
      title: t('swarmManagement.cards.artificialSwarm.title'),
      description: t('swarmManagement.cards.artificialSwarm.description'),
      cta: t('swarmManagement.cards.placeholderCta'),
      icon: <Beaker className="h-5 w-5 text-muted-foreground" />,
      badge: <Badge variant="secondary">{t('swarmManagement.cards.comingSoon')}</Badge>,
      className: 'opacity-70',
      disabled: true,
    },
  ];

  return (
    <PageGrid>
      <MainContent>
        <div className="mb-6 space-y-2">
          <Badge variant="outline">{t('swarmManagement.eyebrow')}</Badge>
          <h1 className="text-2xl font-bold">
            {t('swarmManagement.title')}
          </h1>
        </div>

        <div className="mb-6 space-y-3">
          <h2 className="text-lg font-semibold">
            {t('swarmManagement.aside.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('swarmManagement.aside.description')}
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>{t('swarmManagement.aside.points.0')}</li>
            <li>{t('swarmManagement.aside.points.1')}</li>
            <li>{t('swarmManagement.aside.points.2')}</li>
          </ul>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {methods.map((method) => (
            <SwarmMethodCard
              key={method.key}
              title={method.title}
              description={method.description}
              detail={method.detail}
              cta={method.cta}
              icon={method.icon}
              badge={method.badge}
              className={method.className}
              onClick={method.onClick}
              disabled={method.disabled}
            />
          ))}
        </div>
      </MainContent>
    </PageGrid>
  );
}
