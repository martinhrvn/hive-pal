import { Outlet, useNavigate } from 'react-router-dom';
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

const modeLabels: Record<ImageDisplayMode, string> = {
  banner: 'Banner',
  side: 'Side',
  hidden: 'Hidden',
};

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { mode, cycleMode } = useImageDisplayStore();
  const ModeIcon = modeIcons[mode];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-accent gap-3 p-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {/* Logo/Title */}
            <h1 className="text-xl font-semibold flex items-center gap-5">
              <img className={'w-10'} src={'/hive-pal-logo.png'} alt={'logo'} />
              <a className={'text-foreground'} href={'/'}>
                Hive Pal
              </a>
            </h1>
            <div className="flex items-center gap-4 grow justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={cycleMode}>
                    <ModeIcon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Images: {modeLabels[mode]}</TooltipContent>
              </Tooltip>
              <Button variant={'outline'} onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </header>
        <div className="px-4 pt-4">
          <Breadcrumbs />
        </div>
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
          <Outlet />
        </main>
        <FloatingActionButton />
      </SidebarInset>
    </>
  );
};

export default DashboardLayout;
