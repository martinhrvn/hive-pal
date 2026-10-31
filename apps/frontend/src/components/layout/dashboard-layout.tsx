import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Image, PanelLeft, EyeOff } from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { AppSidebar } from '../app-sidebar';
import { Breadcrumbs } from '../breadcrumbs';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar.tsx';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { FloatingActionButton } from '../common/floating-action-button';
import {
  useImageDisplayStore,
  type ImageDisplayMode,
} from '@/stores/image-display-store';

const modeIcons: Record<ImageDisplayMode, typeof Image> = {
  banner: Image,
  side: PanelLeft,
  hidden: EyeOff,
};

const modeLabelDefaults: Record<ImageDisplayMode, string> = {
  banner: 'Banner',
  side: 'Side',
  hidden: 'Hidden',
};

const DashboardLayout = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const mode = useImageDisplayStore(state => state.mode);
  const cycleMode = useImageDisplayStore(state => state.cycleMode);
  const ModeIcon = modeIcons[mode];
  const imageModeLabel = t('imageDisplay.label', {
    mode: t(`imageDisplay.modes.${mode}`, {
      defaultValue: modeLabelDefaults[mode],
    }),
    defaultValue: 'Images: {{mode}}',
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-accent p-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {/* Logo/Title */}
            <h1 className="text-xl font-semibold">
              <Link to="/" className="flex items-center gap-3 text-foreground">
                <img className="w-10" src="/hive-pal-logo.png" alt="" />
                {t('navigation.brand')}
              </Link>
            </h1>
            <div className="flex items-center gap-4 grow justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={cycleMode}
                    aria-label={imageModeLabel}
                  >
                    <ModeIcon className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{imageModeLabel}</TooltipContent>
              </Tooltip>
              <Button variant="outline" onClick={handleLogout}>
                {t('actions.logout')}
              </Button>
            </div>
          </div>
        </header>
        {/* On the home page the breadcrumb would only say "Home". */}
        {pathname !== '/' && (
          <div className="px-4 pt-4">
            <Breadcrumbs />
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
          <Outlet />
        </main>
        <FloatingActionButton />
      </SidebarInset>
    </>
  );
};

export default DashboardLayout;
