import { useTranslation } from 'react-i18next';
import {
  ToolMeta,
  buildFaqJsonLd,
  buildHowToJsonLd,
  type HowToStepItem,
  buildStructuredData,
  buildWebApplicationJsonLd,
  type FaqItem,
} from '@/components/tool-page';
import {
  generateArtificialSwarmPlan,
  getArtificialSwarmWarnings,
} from './artificial-swarm-planner';
import {
  SwarmMethodPageLayout,
  type CheckpointPlan,
  type CheckpointWarning,
} from './swarm-method-page-layout';

const METHOD_DETAIL_SECTIONS = [
  {
    id: 'preparation',
    items: [0, 1],
    children: {} as Record<number, number[]>,
  },
  {
    id: 'relocateQueen',
    items: [0, 1, 2],
    children: {} as Record<number, number[]>,
  },
  {
    id: 'queenCells',
    items: [0, 1, 2],
    children: {} as Record<number, number[]>,
  },
  {
    id: 'reassembly',
    items: [0, 1, 2],
    children: {} as Record<number, number[]>,
  },
];

export function ArtificialSwarmMethodPage() {
  const { t } = useTranslation('common');
  const faqItems = t('swarmManagement.artificialSwarm.faq.items', {
    returnObjects: true,
  }) as FaqItem[];

  const meta = (
    <ToolMeta
      title={t('swarmManagement.artificialSwarm.meta.title')}
      description={t('swarmManagement.artificialSwarm.meta.description')}
      ogDescription={t('swarmManagement.artificialSwarm.meta.ogDescription')}
      path="/tools/swarm-management/artificial"
      structuredData={buildStructuredData(
        buildWebApplicationJsonLd({
          name: t('swarmManagement.artificialSwarm.meta.appName'),
          path: '/tools/swarm-management/artificial',
          kind: 'reference',
          description: t('swarmManagement.artificialSwarm.meta.appDescription'),
        }),
        buildHowToJsonLd({
          name: t('swarmManagement.artificialSwarm.meta.howTo.name'),
          description: t(
            'swarmManagement.artificialSwarm.meta.howTo.description',
          ),
          steps: t('swarmManagement.artificialSwarm.meta.howTo.steps', {
            returnObjects: true,
          }) as HowToStepItem[],
        }),
        buildFaqJsonLd(faqItems),
      )}
    />
  );

  return (
    <SwarmMethodPageLayout
      ns="swarmManagement.artificialSwarm"
      plannerNs="swarmManagement.planner"
      methodPlannerNs="swarmManagement.artificialSwarm.planner"
      prerequisiteCount={5}
      prosConsCount={5}
      methodDetailSections={METHOD_DETAIL_SECTIONS}
      generatePlan={
        generateArtificialSwarmPlan as (d: Date) => CheckpointPlan[]
      }
      getWarnings={
        getArtificialSwarmWarnings as (
          c: CheckpointPlan[],
        ) => CheckpointWarning[]
      }
      meta={meta}
      faqI18nKey="swarmManagement.artificialSwarm.faq.items"
    />
  );
}
