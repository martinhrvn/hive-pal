import { Outlet } from 'react-router-dom';
import { EditableRoute } from '@/routes/editable-route';

/** Edit-permission guard; viewers are sent back to the queens list. */
export default function EditableQueens() {
  return (
    <EditableRoute redirectTo="/queens">
      <Outlet />
    </EditableRoute>
  );
}
