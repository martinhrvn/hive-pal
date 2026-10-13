import { MemoryRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { HiveForm } from './hive-form';

export const Default = ({
  hiveId = '22222222-2222-4222-8222-222222222222',
}: {
  hiveId?: string;
}) => (
  <MemoryRouter>
    <HiveForm hiveId={hiveId} />
    <Toaster />
  </MemoryRouter>
);
