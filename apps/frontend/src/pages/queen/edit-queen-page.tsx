import { useParams } from 'react-router';
import { EditQueenForm } from './components/form/queen-form';

export const EditQueenPage = () => {
  const { queenId = '' } = useParams<{ queenId: string }>();
  // Remount on navigation between queens so the form picks up new defaults
  return <EditQueenForm key={queenId} queenId={queenId} />;
};
