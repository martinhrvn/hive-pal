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
import { generatePagdenPlan, getPagdenWarnings } from './pagden-planner';
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
    items: [0, 1, 2, 3],
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

export function PagdenMethodPage() {
  const { t } = useTranslation('common');
  const faqItems = t('swarmManagement.pagden.faq.items', {
    returnObjects: true,
  }) as FaqItem[];

  const meta = (
    <ToolMeta
      title={t('swarmManagement.pagden.meta.title')}
      description={t('swarmManagement.pagden.meta.description')}
      ogDescription={t('swarmManagement.pagden.meta.ogDescription')}
      path="/tools/swarm-management/pagden"
      structuredData={buildStructuredData(
        buildWebApplicationJsonLd({
          name: t('swarmManagement.pagden.meta.appName'),
          path: '/tools/swarm-management/pagden',
          kind: 'reference',
          description: t('swarmManagement.pagden.meta.appDescription'),
        }),
        buildHowToJsonLd({
          name: t('swarmManagement.pagden.meta.howTo.name'),
          description: t('swarmManagement.pagden.meta.howTo.description'),
          steps: t('swarmManagement.pagden.meta.howTo.steps', {
            returnObjects: true,
          }) as HowToStepItem[],
        }),
        buildFaqJsonLd(faqItems),
      )}
    />
  );

  return (
    <SwarmMethodPageLayout
      ns="swarmManagement.pagden"
      plannerNs="swarmManagement.planner"
      methodPlannerNs="swarmManagement.pagden.planner"
      prerequisiteCount={5}
      prosConsCount={5}
      methodDetailSections={METHOD_DETAIL_SECTIONS}
      generatePlan={generatePagdenPlan as (d: Date) => CheckpointPlan[]}
      getWarnings={
        getPagdenWarnings as (c: CheckpointPlan[]) => CheckpointWarning[]
      }
      meta={meta}
      faqI18nKey="swarmManagement.pagden.faq.items"
    />
  );
}
