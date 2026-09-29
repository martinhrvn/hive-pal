import { useTranslation } from 'react-i18next';
import { ToolMeta, buildFaqJsonLd, type FaqItem } from '@/components/tool-page';
import { generateArtificialSwarmPlan, getArtificialSwarmWarnings } from './artificial-swarm-planner';
import { SwarmMethodPageLayout, type CheckpointPlan, type CheckpointWarning } from './swarm-method-page-layout';

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
  const faqItems = t('swarmManagement.artificialSwarm.faq.items', { returnObjects: true }) as FaqItem[];

  const meta = (
    <ToolMeta
      title="Artificial Swarm Method: Swarm Control Guide and Planner — Hive Pal"
      description="Free reference guide and inspection planner for the artificial swarm swarm-control method. Prerequisites, step-by-step instructions, follow-up timing, and pros/cons for honey bee beekeepers."
      ogDescription="Step-by-step artificial swarm method for honey bee swarm control when the queen cannot be found, with follow-up timing and an inspection planner."
      path="/tools/swarm-management/artificial"
      structuredData={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'Artificial Swarm Method Guide and Planner',
            url: 'https://hivepal.app/tools/swarm-management/artificial',
            applicationCategory: 'EducationalApplication',
            applicationSubCategory: 'Beekeeping Reference',
            operatingSystem: 'Web',
            browserRequirements: 'Requires JavaScript',
            description: 'Reference guide and inspection planner for the artificial swarm swarm-control method, with prerequisites, step-by-step instructions, pros/cons, and follow-up timing.',
            isAccessibleForFree: true,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            publisher: { '@type': 'Organization', name: 'Hive Pal', url: 'https://hivepal.app' },
          },
          {
            '@type': 'HowTo',
            name: 'How to perform the artificial swarm method',
            description: 'Step-by-step artificial swarm procedure for moving the parent colony aside while placing a new hive on the original stand with a frame containing a queen cell.',
            step: [
              { '@type': 'HowToStep', name: 'Preparation', text: 'Find a spare brood box with drawn comb and prepare a second hive floor and stand a few metres away.' },
              { '@type': 'HowToStep', name: 'Move the Parent Colony', text: 'Move the original hive (with the queen) to a new location. Identify a frame with a queen cell or eggs and reduce other queen cells.' },
              { '@type': 'HowToStep', name: 'Set Up the New Colony', text: 'Place the new brood box on the original stand with the selected brood frame in the centre, filled with drawn comb.' },
              { '@type': 'HowToStep', name: 'Reassembly', text: 'Add a queen excluder and supers to the new hive as needed. Fit crown board and roof on both hives.' },
              { '@type': 'HowToStep', name: 'Follow-up at day 7-8', text: 'Inspect the new colony to confirm the queen cell is developing and check for additional queen cells.' },
              { '@type': 'HowToStep', name: 'Follow-up at day 14-15', text: 'Confirm the queen cell is capped and developing. Monitor the parent colony.' },
              { '@type': 'HowToStep', name: 'Follow-up at day 21-22', text: 'Confirm the new queen is mated and laying in the new colony.' },
            ],
          },
          buildFaqJsonLd(faqItems),
        ],
      }}
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
      generatePlan={generateArtificialSwarmPlan as (d: Date) => CheckpointPlan[]}
      getWarnings={getArtificialSwarmWarnings as (c: CheckpointPlan[]) => CheckpointWarning[]}
      meta={meta}
      faqI18nKey="swarmManagement.artificialSwarm.faq.items"
    />
  );
}
