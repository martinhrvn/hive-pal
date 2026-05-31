import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/auth-context';
import { decodeJwt } from '../utils/jwt-utils';
import { cn } from '../lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

type NavAdminProps = {
  collapsed?: boolean;
};

export function NavAdmin({ collapsed: collapsedProp }: NavAdminProps) {
  const { t } = useTranslation('common');
  const { token } = useAuth();
  const location = useLocation();
  const { isMobile, setOpenMobile, state } = useSidebar();
  // Honor explicit prop if provided, otherwise derive from the sidebar's own
  // collapsed state (icon-only variant sets state === 'collapsed').
  const collapsed = collapsedProp ?? (!isMobile && state === 'collapsed');

  const handleMobileClose = () => {
    if (isMobile) setOpenMobile(false);
  };

  // Get role from token first (more secure), then fallback to user object
  const decodedToken = token ? decodeJwt(token) : null;
  const tokenRole = decodedToken?.role;
  // Only render admin nav items if user is admin
  if (tokenRole !== 'ADMIN') {
    return null;
  }

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div
      className={cn(
        'py-2',
        collapsed ? 'px-1 mt-2 border-t border-sidebar-border pt-3' : 'px-3',
      )}
    >
      {!collapsed && (
        <h2 className="mb-2 px-4 text-xs font-semibold tracking-wider uppercase text-sidebar-foreground/60">
          {t('navigation.admin')}
        </h2>
      )}
      <div className="space-y-1">
        <Link
          to="/admin/users"
          onClick={handleMobileClose}
          className={cn(
            'flex items-center justify-start w-full rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
            collapsed ? 'h-8 w-8 mx-auto p-0' : 'px-3 py-2',
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
        <Link
          to="/admin/feedback"
          onClick={handleMobileClose}
          className={cn(
            'flex items-center justify-start w-full rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
            collapsed ? 'h-8 w-8 mx-auto p-0' : 'px-3 py-2',
            {
              'justify-center': collapsed,
              'bg-accent': isActive('/admin/feedback'),
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
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {!collapsed && <span>{t('navigation.feedback')}</span>}
        </Link>
        <Link
          to="/admin/frame-sizes"
          onClick={handleMobileClose}
          className={cn(
            'flex items-center justify-start w-full rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
            collapsed ? 'h-8 w-8 mx-auto p-0' : 'px-3 py-2',
            {
              'justify-center': collapsed,
              'bg-accent': isActive('/admin/frame-sizes'),
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
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 8h20" />
            <path d="M2 12h20" />
          </svg>
          {!collapsed && <span>Frame Sizes</span>}
        </Link>
        <Link
          to="/admin/metrics"
          onClick={handleMobileClose}
          className={cn(
            'flex items-center justify-start w-full rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
            collapsed ? 'h-8 w-8 mx-auto p-0' : 'px-3 py-2',
            {
              'justify-center': collapsed,
              'bg-accent': isActive('/admin/metrics'),
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
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
          {!collapsed && <span>{t('navigation.metrics')}</span>}
        </Link>
        <Link
          to="/admin/media"
          onClick={handleMobileClose}
          className={cn(
            'flex items-center justify-start w-full rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
            collapsed ? 'h-8 w-8 mx-auto p-0' : 'px-3 py-2',
            {
              'justify-center': collapsed,
              'bg-accent': isActive('/admin/media'),
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
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          {!collapsed && <span>Media</span>}
        </Link>
        <Link
          to="/admin/worker-tokens"
          onClick={handleMobileClose}
          className={cn(
            'flex items-center justify-start w-full rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
            collapsed ? 'h-8 w-8 mx-auto p-0' : 'px-3 py-2',
            {
              'justify-center': collapsed,
              'bg-accent': isActive('/admin/worker-tokens'),
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
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
          {!collapsed && <span>Worker Tokens</span>}
        </Link>
      </div>
    </div>
  );
}
