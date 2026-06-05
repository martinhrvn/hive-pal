import { Link, Outlet } from 'react-router-dom';
import { Github, BookOpen, Beaker, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TOOL_LINKS = [
  { to: '/tools/syrup-calculator', label: 'Syrup Calculator', icon: Beaker },
  { to: '/tools/brood-timeline', label: 'Brood Timeline', icon: Bug },
];

export const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 to-green-50">
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center">
              <div className="text-2xl font-bold text-amber-600">🐝</div>
              <h1 className="ml-2 text-xl font-semibold text-gray-900">
                Hive Pal
              </h1>
              <span className="ml-3 hidden sm:inline-flex text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Open Source
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              {TOOL_LINKS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm font-medium"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <a
                href="https://docs.hivepal.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm font-medium"
              >
                <BookOpen className="h-4 w-4" />
                Docs
              </a>
            </nav>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600">
                <Link to="/register">Start Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      <footer className="bg-gray-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-3">
                <div className="text-2xl font-bold text-amber-400">🐝</div>
                <span className="ml-2 text-lg font-semibold">Hive Pal</span>
              </div>
              <p className="text-gray-400 text-sm leading-6">
                Free and open-source beekeeping management platform.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Free Tools</h3>
              <ul className="space-y-2">
                {TOOL_LINKS.map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Project</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://docs.hivepal.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <Link
                    to="/releases"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Release Notes
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/martinhrvn/hive-pal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white text-sm inline-flex items-center gap-1"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                </li>
                <li>
                  <Link
                    to="/privacy-policy"
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-sm text-gray-400 text-center">
              © {new Date().getFullYear()} Hive Pal. Released under MIT License.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
