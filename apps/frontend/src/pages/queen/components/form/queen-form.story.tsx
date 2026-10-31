import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router';
import { Toaster } from 'sonner';
import { CreateQueenForm, EditQueenForm } from './queen-form';

/** Stands in for whatever page the form navigates to after saving. */
const Landed = () => <p data-test="landed">{useLocation().pathname}</p>;

const EditRoute = () => {
  const { queenId = '' } = useParams();
  return <EditQueenForm queenId={queenId} />;
};

export const QueenFormRoutes = ({ path }: { path: string }) => (
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/queens/create" element={<CreateQueenForm />} />
      <Route
        path="/hives/:hiveId/queens/create"
        element={<CreateQueenForm />}
      />
      <Route path="/queens/:queenId/edit" element={<EditRoute />} />
      <Route path="*" element={<Landed />} />
    </Routes>
    <Toaster />
  </MemoryRouter>
);
