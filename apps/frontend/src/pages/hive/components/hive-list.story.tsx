import { MemoryRouter, Route, Routes, useParams } from 'react-router';
import type { HiveResponse } from 'shared-schemas';
import {
  useImageDisplayStore,
  type ImageDisplayMode,
} from '@/stores/image-display-store';
import { HiveList } from './hive-list';

// Inline image so the story never hits the network.
const PHOTO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#d4a24c"/></svg>',
  );

const HiveDetailMarker = () => {
  const { id } = useParams();
  return <p>Hive detail {id}</p>;
};

/** One dashboard hive card; clicking through lands on a hive detail marker. */
export const HiveCardStory = ({
  withPhoto = true,
  imageMode = 'banner',
  withWarnings = false,
}: {
  withPhoto?: boolean;
  imageMode?: ImageDisplayMode;
  withWarnings?: boolean;
}) => {
  useImageDisplayStore.setState({ mode: imageMode });
  const hive = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Volk 7',
    status: 'ACTIVE',
    lastInspectionDate: new Date().toISOString(),
    lastInspectionStrength: 8,
    lastInspectionTotalFrames: 10,
    lastInspectionWarnings: withWarnings ? ['swarm_preparation'] : [],
    alerts: [],
    boxes: [],
    settings: null,
    featurePhotoUrl: withPhoto ? PHOTO : null,
    updatedAt: new Date().toISOString(),
  } as unknown as HiveResponse;

  return (
    <MemoryRouter>
      <div className="w-[1000px] p-4">
        <Routes>
          <Route
            path="/"
            element={<HiveList hives={[hive]} isSubjective={false} />}
          />
          <Route path="/hives/:id" element={<HiveDetailMarker />} />
        </Routes>
      </div>
    </MemoryRouter>
  );
};
