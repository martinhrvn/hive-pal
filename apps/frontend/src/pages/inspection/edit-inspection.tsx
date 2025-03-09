import { InspectionForm } from '@/pages/inspection/components/inspection-form';
import { useParams } from 'react-router-dom';

export const EditInspectionPage = () => {
  const { id } = useParams<{ id: string }>();
  return <InspectionForm inspectionId={id} />;
};
