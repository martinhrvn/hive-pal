import { useTranslation } from 'react-i18next';
import type { AdminUser } from 'shared-schemas';
import { StatusPill } from '@/components/common/status-pill';

export function RolePill({ role }: Readonly<{ role: AdminUser['role'] }>) {
  const { t } = useTranslation('admin');
  return (
    <StatusPill tone={role === 'ADMIN' ? 'info' : 'neutral'} size="sm">
      {t(`users.roles.${role}`)}
    </StatusPill>
  );
}

/** Banned beats a pending password change, which beats plain active. */
export function UserStatusPill({
  user,
}: Readonly<{
  user: Pick<AdminUser, 'banned' | 'banReason' | 'passwordChangeRequired'>;
}>) {
  const { t } = useTranslation('admin');
  if (user.banned) {
    return (
      <StatusPill tone="danger" size="sm" title={user.banReason ?? undefined}>
        {t('users.status.banned')}
      </StatusPill>
    );
  }
  if (user.passwordChangeRequired) {
    return (
      <StatusPill tone="warning" size="sm">
        {t('users.status.mustChangePassword')}
      </StatusPill>
    );
  }
  return (
    <StatusPill tone="success" size="sm">
      {t('users.status.active')}
    </StatusPill>
  );
}
