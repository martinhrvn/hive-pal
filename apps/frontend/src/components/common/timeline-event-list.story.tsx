import { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { InspectionStatus, type InspectionResponse } from 'shared-schemas';
import { TimelineEventList } from './timeline-event-list';

/**
 * Story harness for the timeline's inspection rows. It records which
 * inspection a row click would open, so component tests can tell expanding the
 * details apart from navigating away.
 */

const HIVE_ID = '11111111-1111-4111-8111-111111111111';

const detailedInspection: InspectionResponse = {
  id: '22222222-2222-4222-8222-222222222222',
  hiveId: HIVE_ID,
  date: '2026-05-01T10:00:00.000Z',
  status: InspectionStatus.COMPLETED,
  temperature: 21,
  weatherConditions: 'partly-cloudy',
  notes:
    'Colony is building up fast and has drawn out the whole second box.\nAdd a super next week before the flow starts.',
  observations: {
    strength: 8,
    cappedBrood: 7,
    honeyStores: 5,
    queenSeen: true,
    queenCells: 2,
    swarmCells: true,
    cappedBroodFrames: 6,
    honeyFrames: 3,
    broodPattern: 'solid',
    additionalObservations: ['calm'],
    reminderObservations: ['needs_super'],
  },
  score: {
    overallScore: 7.5,
    populationScore: 8,
    storesScore: 5,
    queenScore: 9,
    warnings: [],
    confidence: 1,
  },
  actions: [],
};

const bareInspection: InspectionResponse = {
  id: '33333333-3333-4333-8333-333333333333',
  hiveId: HIVE_ID,
  date: '2026-04-20T10:00:00.000Z',
  status: InspectionStatus.COMPLETED,
  actions: [],
};

const Harness = ({ inspections }: { inspections: InspectionResponse[] }) => {
  const [opened, setOpened] = useState('');

  return (
    <MemoryRouter>
      <div className="max-w-xl p-4">
        <pre data-test="opened-inspection">{opened}</pre>
        <TimelineEventList
          inspections={inspections}
          actions={[]}
          quickChecks={[]}
          handlers={{ onInspectionClick: ins => setOpened(ins.id) }}
        />
      </div>
    </MemoryRouter>
  );
};

/** A completed inspection with notes, weather, scores and observations. */
export const InspectionWithDetails = () => (
  <Harness inspections={[detailedInspection]} />
);

/** Nothing recorded beyond the date: there is nothing to expand. */
export const InspectionWithoutDetails = () => (
  <Harness inspections={[bareInspection]} />
);
