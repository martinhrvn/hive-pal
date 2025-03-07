import { InspectionForm } from '@/pages/inspection/components/inspection-form';
import { useParams } from 'react-router-dom';

export const CreateInspectionPage = () => {
  const { hiveId } = useParams<{ hiveId: string }>();
  return <InspectionForm hiveId={hiveId} />;
};
