import { Outlet } from 'react-router-dom';
import { EditableRoute } from '@/routes/editable-route';

/** Edit-permission guard; viewers are sent back to the inspections list. */
export default function EditableInspections() {
  return (
    <EditableRoute redirectTo="/inspections">
      <Outlet />
    </EditableRoute>
  );
}
