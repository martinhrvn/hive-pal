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
import { generateDemareePlan, getDemareeWarnings } from './demaree-planner';
import {
  SwarmMethodPageLayout,
  type CheckpointPlan,
  type CheckpointWarning,
} from './swarm-method-page-layout';

const METHOD_DETAIL_SECTIONS = [
  {
    id: 'preparation',
    items: [0, 1],
    children: { 0: [0] } as Record<number, number[]>,
  },
  {
    id: 'huntTheQueen',
    items: [0, 1],
    children: {} as Record<number, number[]>,
  },
  {
    id: 'broodManipulation',
    items: [0, 1, 2],
    children: { 0: [0], 1: [0], 2: [0, 1, 2] } as Record<number, number[]>,
  },
  {
    id: 'reassembly',
    items: [0, 1, 2, 3, 4],
    children: {} as Record<number, number[]>,
  },
];

export function DemareeMethodPage() {
  const { t } = useTranslation('common');
  const faqItems = t('swarmManagement.demaree.faq.items', {
    returnObjects: true,
  }) as FaqItem[];

  const meta = (
    <ToolMeta
      title={t('swarmManagement.demaree.meta.title')}
      description={t('swarmManagement.demaree.meta.description')}
      ogDescription={t('swarmManagement.demaree.meta.ogDescription')}
      path="/tools/swarm-management/demaree"
      structuredData={buildStructuredData(
        buildWebApplicationJsonLd({
          name: t('swarmManagement.demaree.meta.appName'),
          path: '/tools/swarm-management/demaree',
          kind: 'reference',
          description: t('swarmManagement.demaree.meta.appDescription'),
        }),
        buildHowToJsonLd({
          name: t('swarmManagement.demaree.meta.howTo.name'),
          description: t('swarmManagement.demaree.meta.howTo.description'),
          steps: t('swarmManagement.demaree.meta.howTo.steps', {
            returnObjects: true,
          }) as HowToStepItem[],
        }),
        buildFaqJsonLd(faqItems),
      )}
    />
  );

  return (
    <SwarmMethodPageLayout
      ns="swarmManagement.demaree"
      plannerNs="swarmManagement.planner"
      methodPlannerNs="swarmManagement.planner"
      prerequisiteCount={6}
      prosConsCount={5}
      methodDetailSections={METHOD_DETAIL_SECTIONS}
      generatePlan={generateDemareePlan as (d: Date) => CheckpointPlan[]}
      getWarnings={
        getDemareeWarnings as (c: CheckpointPlan[]) => CheckpointWarning[]
      }
      meta={meta}
      faqI18nKey="swarmManagement.demaree.faq.items"
    />
  );
}
