import { useParams } from 'react-router-dom';
import { QueenForm } from './components/queen-form';

export const EditQueenPage = () => {
  const { queenId } = useParams<{ queenId: string }>();

  return <QueenForm queenId={queenId} />;
};
