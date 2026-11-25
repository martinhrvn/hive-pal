import { useState } from 'react';
import { UserActionsMenu, type UserMenuTarget } from './user-actions-menu';

/** Story harness: prints the action each menu entry reports. */

const Harness = ({
  isSelf = false,
  banned = false,
  role = 'USER',
}: {
  isSelf?: boolean;
  banned?: boolean;
  role?: UserMenuTarget['role'];
}) => {
  const [selected, setSelected] = useState('');
  return (
    <div className="flex items-center gap-4 p-4">
      <UserActionsMenu
        user={{ id: 'u1', email: 'bea@example.com', role, banned }}
        isSelf={isSelf}
        onSelect={action => setSelected(action)}
      />
      <span data-test="selected">{selected}</span>
    </div>
  );
};

/** Another active user: every action is offered. */
export const OtherUser = () => <Harness />;

/** A banned admin: offers unban and removing the admin role. */
export const BannedAdmin = () => <Harness banned role="ADMIN" />;

/** The signed-in admin: no role change, ban or delete on yourself. */
export const Self = () => <Harness isSelf role="ADMIN" />;
