import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/auth-context';
import { decodeJwt } from '../utils/jwt-utils';
import { cn } from '../lib/utils';

type NavAdminProps = {
  collapsed?: boolean;
};

export function NavAdmin({ collapsed = false }: NavAdminProps) {
  const { t } = useTranslation('common');
  const { token } = useAuth();
  const location = useLocation();

  // Get role from token first (more secure), then fallback to user object
  const decodedToken = token ? decodeJwt(token) : null;
  const tokenRole = decodedToken?.role;
  // Only render admin nav items if user is admin
  if (tokenRole !== 'ADMIN') {
    return null;
  }

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="px-3 py-2">
      <h2
        className={cn('mb-2 px-4 text-lg font-semibold tracking-tight', {
          'text-center': collapsed,
        })}
      >
        {!collapsed ? t('navigation.admin') : 'A'}
      </h2>
      <div className="space-y-1">
        <Link
          to="/admin/users"
          className={cn(
            'flex items-center justify-start w-full rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
            {
              'justify-center': collapsed,
              'bg-accent': isActive('/admin/users'),
            },
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn('h-4 w-4', {
              'mr-2': !collapsed,
            })}
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {!collapsed && <span>{t('navigation.users')}</span>}
        </Link>
      </div>
    </div>
  );
}
