import { useState } from 'react';
import { FrameSize } from 'shared-schemas';
import { FrameSizesCardView } from './frame-sizes-card';

/**
 * Story harness for the settings card that lists the user's own frame sizes.
 * The fixtures deliberately mix built-in sizes, another user's size and the
 * caller's own sizes: the card must only offer editing for the latter.
 */

const CURRENT_USER = '11111111-1111-4111-8111-111111111111';
const OTHER_USER = '22222222-2222-4222-8222-222222222222';

const SIZES: FrameSize[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Langstroth Deep',
    width: 448,
    height: 232,
    depth: 25,
    isBuiltIn: true,
    status: 'APPROVED',
    createdByUserId: null,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    name: '12x10',
    width: 300,
    height: 250,
    depth: 12,
    isBuiltIn: false,
    status: 'APPROVED',
    createdByUserId: CURRENT_USER,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    name: 'Danish shallow',
    width: 300,
    height: 120,
    depth: 12,
    isBuiltIn: false,
    status: 'PENDING',
    createdByUserId: CURRENT_USER,
    createdAt: '2026-02-02T10:00:00.000Z',
    updatedAt: '2026-02-02T10:00:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    name: 'NL 10',
    width: 330,
    height: 205,
    depth: 20,
    isBuiltIn: false,
    status: 'APPROVED',
    createdByUserId: OTHER_USER,
    createdAt: '2026-01-20T10:00:00.000Z',
    updatedAt: '2026-01-20T10:00:00.000Z',
  },
];

const Harness = ({ initialSizes }: { initialSizes: FrameSize[] }) => {
  const [sizes, setSizes] = useState(initialSizes);

  return (
    <div className="mx-auto max-w-2xl p-4">
      <FrameSizesCardView
        sizes={sizes}
        currentUserId={CURRENT_USER}
        onSave={async (id, data) => {
          setSizes(previous =>
            previous.map(size =>
              size.id === id ? { ...size, ...data } : size,
            ),
          );
        }}
      />
    </div>
  );
};

export const Default = () => <Harness initialSizes={SIZES} />;

export const Empty = () => <Harness initialSizes={[]} />;
