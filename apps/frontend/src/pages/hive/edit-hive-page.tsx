import { useParams } from 'react-router-dom';
import { HiveForm } from './components/hive-form';

export const EditHivePage = () => {
  const { id } = useParams<{ id: string }>();

  return <HiveForm hiveId={id} />;
};
