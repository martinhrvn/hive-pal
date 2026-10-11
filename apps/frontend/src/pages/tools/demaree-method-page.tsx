import { useTranslation } from 'react-i18next';
import {
  ToolMeta,
  buildFaqJsonLd,
  buildHowToJsonLd,
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
      title="Demaree Method: Swarm Control Guide and Planner — Hive Pal"
      description="Free reference guide and inspection planner for the Demaree swarm-control method. Prerequisites, step-by-step instructions, follow-up timing, and pros/cons for honey bee beekeepers."
      ogDescription="Step-by-step Demaree method for honey bee swarm control, with follow-up timing and an inspection planner."
      path="/tools/swarm-management/demaree"
      structuredData={buildStructuredData(
        buildWebApplicationJsonLd({
          name: 'Demaree Swarm-Control Method Guide and Planner',
          path: '/tools/swarm-management/demaree',
          kind: 'reference',
          description:
            'Reference guide and inspection planner for the Demaree swarm-control method, with prerequisites, step-by-step instructions, pros/cons, and follow-up timing.',
        }),
        buildHowToJsonLd({
          name: 'How to perform the Demaree swarm-control method',
          description:
            'Step-by-step Demaree procedure for relieving swarm pressure in a strong honey bee colony without splitting it.',
          steps: [
            {
              name: 'Preparation',
              text: 'Place a spare brood box with drawn comb or foundation on the hive floor below the existing brood.',
            },
            {
              name: 'Hunt the queen',
              text: 'Find the laying queen, place her and the frame she is on into the centre of the new bottom box, and remove any queen cells from that frame.',
            },
            {
              name: 'Brood manipulation',
              text: 'Consolidate brood frames above and knock down every queen cell. Shake bees off frames to make sure no cells are missed.',
            },
            {
              name: 'Reassembly',
              text: 'Stack queen excluder, two or more honey supers, a second queen excluder, and the brood box above. Refit the crown board and roof.',
            },
            {
              name: 'Follow-up at day 7-8',
              text: 'Inspect the upper brood box for emergency queen cells and remove any that have been started.',
            },
            {
              name: 'Follow-up at day 14-15',
              text: 'Recheck for late-started queen cells and confirm the brood arrangement still supports the Demaree setup.',
            },
            {
              name: 'Follow-up at day 21-22',
              text: 'Carry out a final review and decide whether the colony can be normalised or still needs close monitoring.',
            },
          ],
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
