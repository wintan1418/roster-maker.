import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/teams': 'Teams',
  '/rosters': 'Rosters',
  '/rosters/new': 'New Roster',
  '/org/settings': 'Organization Settings',
};

function getPageTitle(pathname) {
  // Try exact match first
  if (pageTitles[pathname]) return pageTitles[pathname];

  // Try pattern matches
  if (/^\/teams\/[^/]+$/.test(pathname)) return 'Team Details';
  if (/^\/rosters\/[^/]+$/.test(pathname)) return 'Edit Roster';

  return 'RosterFlow';
}

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const title = getPageTitle(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Desktop sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile sidebar drawer */}
      {mobileMenuOpen && (
        <Sidebar
          mobile
          collapsed={false}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
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
