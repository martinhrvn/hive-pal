import { Outlet } from 'react-router-dom';
import { EditableRoute } from '@/routes/editable-route';

/** Edit-permission guard; viewers are sent back to the apiaries list. */
export default function EditableApiaries() {
  return (
    <EditableRoute redirectTo="/apiaries">
      <Outlet />
    </EditableRoute>
  );
}
