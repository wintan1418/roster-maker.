import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import useAuth from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/teams': 'Teams',
  '/rosters': 'Rosters',
  '/rosters/new': 'New Roster',
  '/org/settings': 'Organization Settings',
};

function getPageTitle(pathname) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (/^\/teams\/[^/]+$/.test(pathname)) return 'Team Details';
  if (/^\/rosters\/[^/]+$/.test(pathname)) return 'Edit Roster';
  return 'RosterFlow';
}

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, initialized } = useAuth();

  const title = getPageTitle(location.pathname);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (initialized && !user) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [initialized, user, navigate, location.pathname]);

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  // Don't render the layout while redirecting
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {mobileMenuOpen && (
        <Sidebar
          mobile
          collapsed={false}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden relative z-[35]">
        <Header
          title={title}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
