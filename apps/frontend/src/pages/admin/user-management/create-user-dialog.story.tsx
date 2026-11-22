import { useState } from 'react';
import type { AdminCreateUser, AdminUser } from 'shared-schemas';
import { Button } from '@/components/ui/button';
import { CreateUserDialog } from './create-user-dialog';

/**
 * Story harness for the create-user dialog: `onCreate` is stubbed and the
 * request body it received is printed, so specs can assert both the flow and
 * what would be sent to the API.
 */

interface HarnessProps {
  mailEnabled?: boolean;
  /** HTTP status the stubbed API answers with; 201 succeeds. */
  status?: 201 | 409;
}

const Harness = ({ mailEnabled = true, status = 201 }: HarnessProps) => {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState('');

  const onCreate = (input: AdminCreateUser): Promise<AdminUser> => {
    setSent(JSON.stringify(input));
    if (status === 409) {
      // Shaped like an Axios error so the dialog maps it to the email field.
      return Promise.reject(
        Object.assign(new Error('Conflict'), {
          isAxiosError: true,
          response: { status: 409, data: { message: 'exists' } },
        }),
      );
    }
    return Promise.resolve({
      id: 'u1',
      email: input.email.toLowerCase(),
      name: input.name,
      role: input.role,
      passwordChangeRequired: input.credential === 'password',
      createdAt: new Date('2026-11-01'),
      updatedAt: new Date('2026-11-01'),
      lastLoginAt: null,
      banned: false,
      banReason: null,
      banExpires: null,
    });
  };

  return (
    <div className="space-y-3 p-4">
      <Button data-test="open-dialog" onClick={() => setOpen(true)}>
        Create user
      </Button>
      <pre data-test="last-request">{sent}</pre>
      <CreateUserDialog
        open={open}
        onOpenChange={setOpen}
        mailEnabled={mailEnabled}
        onCreate={onCreate}
      />
    </div>
  );
};

/** Mail is configured, so both sign-in options are available. */
export const Default = () => <Harness />;

/** Without mail the setup-link option is disabled and explained. */
export const MailDisabled = () => <Harness mailEnabled={false} />;

/** The API reports the email as taken. */
export const EmailTaken = () => <Harness status={409} />;
