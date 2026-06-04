import { ArrowRight, Beaker, Lock, Waypoints } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  MainContent,
  PageGrid,
} from '@/components/layout/page-grid-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function SwarmManagementOverviewPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

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
          <Card className="border-primary/30 bg-primary/5 lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Waypoints className="h-5 w-5 text-primary" />
                  {t('swarmManagement.cards.demaree.title')}
                </CardTitle>
                <Badge>{t('swarmManagement.cards.available')}</Badge>
              </div>
              <CardDescription>
                {t('swarmManagement.cards.demaree.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('swarmManagement.cards.demaree.detail')}
              </p>
              <Button onClick={() => navigate('/tools/swarm-management/demaree')}>
                {t('swarmManagement.cards.demaree.cta')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="opacity-70">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Beaker className="h-5 w-5 text-muted-foreground" />
                  {t('swarmManagement.cards.pagden.title')}
                </CardTitle>
                <Badge variant="secondary">
                  {t('swarmManagement.cards.comingSoon')}
                </Badge>
              </div>
              <CardDescription>
                {t('swarmManagement.cards.pagden.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled>
                <Lock className="mr-2 h-4 w-4" />
                {t('swarmManagement.cards.placeholderCta')}
              </Button>
            </CardContent>
          </Card>

          <Card className="opacity-70">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Beaker className="h-5 w-5 text-muted-foreground" />
                  {t('swarmManagement.cards.artificialSwarm.title')}
                </CardTitle>
                <Badge variant="secondary">
                  {t('swarmManagement.cards.comingSoon')}
                </Badge>
              </div>
              <CardDescription>
                {t('swarmManagement.cards.artificialSwarm.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled>
                <Lock className="mr-2 h-4 w-4" />
                {t('swarmManagement.cards.placeholderCta')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainContent>
    </PageGrid>
  );
}
