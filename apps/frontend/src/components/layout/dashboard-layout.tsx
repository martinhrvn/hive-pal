import { Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/auth-context.tsx';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="">
      <header className="bg-accent gap-3 p-4">
        <div className="flex items-center h-16 justify-between">
          {/* Logo/Title */}
          <h1 className="text-xl font-semibold flex items-center gap-5">
            <img className={'w-10'} src={'/hive-pal-logo.png'} />
            <a className={'text-foreground'} href={'/'}>
              Hive Pal
            </a>
          </h1>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
