import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/rosters', label: 'Rosters', icon: Calendar },
  { to: '/org/settings', label: 'Org Settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, mobile = false, onClose }) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'flex flex-col bg-surface-900 text-white transition-all duration-300 ease-in-out',
          mobile
            ? 'fixed inset-y-0 left-0 z-50 w-64 shadow-2xl'
            : [
                'relative z-30 hidden md:flex',
                collapsed ? 'w-[72px]' : 'w-64',
              ]
        )}
      >
        {/* Brand */}
        <div
          className={clsx(
            'flex h-16 items-center border-b border-white/10 px-4',
            collapsed && !mobile ? 'justify-center' : 'gap-3'
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500 font-bold text-white text-sm">
            RF
          </div>
          {(!collapsed || mobile) && (
            <span className="text-lg font-semibold tracking-tight whitespace-nowrap">
              RosterFlow
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={mobile ? onClose : undefined}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  collapsed && !mobile ? 'justify-center' : 'gap-3',
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                    : 'text-surface-300 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {(!collapsed || mobile) && <span className="whitespace-nowrap">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        {!mobile && (
          <button
            onClick={onToggle}
            className="mx-3 mb-2 flex items-center justify-center rounded-lg p-2 text-surface-400 transition-colors hover:bg-white/10 hover:text-white"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        )}

        {/* User profile section */}
        <div
          className={clsx(
            'border-t border-white/10 p-3',
            collapsed && !mobile ? 'flex justify-center' : ''
          )}
        >
          <div
            className={clsx(
              'flex items-center rounded-lg p-2 transition-colors hover:bg-white/10',
              collapsed && !mobile ? 'justify-center' : 'gap-3'
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-400 text-xs font-semibold text-white">
              JD
            </div>
            {(!collapsed || mobile) && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-white">John Doe</p>
                <p className="truncate text-xs text-surface-400">Admin</p>
              </div>
            )}
            {(!collapsed || mobile) && (
              <button
                className="shrink-0 text-surface-400 transition-colors hover:text-white"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
