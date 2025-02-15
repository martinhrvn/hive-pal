import { Outlet, Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  ChevronDown,
  Home,
  FileText,
  Thermometer,
  Package,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/auth-context.tsx";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Mock data - replace with real data later
  const apiaries = [
    { id: 1, name: "Home Apiary" },
    { id: 2, name: "Mountain Site" },
    { id: 3, name: "Valley Location" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="flex h-16 items-center px-4 gap-4">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger className="lg:hidden">
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <nav className="flex flex-col gap-4 mt-4">
                <Link
                  to="/"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  to="/inspections"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <FileText className="h-4 w-4" />
                  Inspections
                </Link>
                <Link
                  to="/weather"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Thermometer className="h-4 w-4" />
                  Weather
                </Link>
                <Link
                  to="/inventory"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Package className="h-4 w-4" />
                  Inventory
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo/Title */}
          <h1 className="text-xl font-semibold">Beekeeping Manager</h1>

          {/* Apiary Selector */}
          <Select>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Apiary" />
            </SelectTrigger>
            <SelectContent>
              {apiaries.map((apiary) => (
                <SelectItem key={apiary.id} value={apiary.id.toString()}>
                  {apiary.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side icons */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Bell className="h-5 w-5 text-gray-500" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1">
                <div className="h-8 w-8 rounded-full bg-gray-200" />
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => navigate("/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar - hidden on mobile */}
        <aside className="hidden lg:flex h-[calc(100vh-4rem)] w-64 flex-col border-r bg-white">
          <nav className="flex-1 space-y-1 p-4">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/inspections"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <FileText className="h-4 w-4" />
              Inspections
            </Link>
            <Link
              to="/weather"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <Thermometer className="h-4 w-4" />
              Weather
            </Link>
            <Link
              to="/inventory"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <Package className="h-4 w-4" />
              Inventory
            </Link>
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
