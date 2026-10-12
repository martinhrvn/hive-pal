import { Outlet } from 'react-router-dom';
import { EditableRoute } from '@/routes/editable-route';

/** Edit-permission guard; viewers are sent back to the hives list. */
export default function EditableHives() {
  return (
    <EditableRoute redirectTo="/hives">
      <Outlet />
    </EditableRoute>
  );
}
