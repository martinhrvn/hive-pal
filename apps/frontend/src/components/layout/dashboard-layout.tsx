import { Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/auth-context.tsx';
import { AppSidebar } from '../app-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar.tsx';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

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
              <img className={'w-10'} src={'/hive-pal-logo.png'} />
              <a className={'text-foreground'} href={'/'}>
                Hive Pal
              </a>
            </h1>
            <div className="flex items-center gap-4 grow justify-end">
              <Button variant={'outline'} onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </>
  );
};

export default DashboardLayout;
