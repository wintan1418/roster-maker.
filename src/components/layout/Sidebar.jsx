import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarDays,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Pencil,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useAuthStore from '@/stores/authStore';
import useChatNotifStore from '@/stores/chatNotifStore';
import { getInitials } from '@/lib/utils';

// Super admin — full navigation including Org Settings
const superAdminNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/my-schedule', label: 'My Schedule', icon: CalendarDays },
  { to: '/my-team', label: 'My Team', icon: MessageSquare },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/rosters', label: 'Rosters', icon: Calendar },
  { to: '/org/settings', label: 'Org Settings', icon: Settings },
];

// Team admin — can manage teams/rosters but not Org Settings
const teamAdminNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/my-schedule', label: 'My Schedule', icon: CalendarDays },
  { to: '/my-team', label: 'My Team', icon: MessageSquare },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/rosters', label: 'Rosters', icon: Calendar },
];

// Restricted member navigation
const memberNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/my-schedule', label: 'My Schedule', icon: CalendarDays },
  { to: '/my-team', label: 'My Team', icon: MessageSquare },
];

export default function Sidebar({ collapsed, onToggle, mobile = false, onClose }) {
  const navigate = useNavigate();
  const { user, profile, orgRole, signOut, updateProfile } = useAuthStore();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const unreadCounts = useChatNotifStore((s) => s.unreadCounts);
  const hasMention = useChatNotifStore((s) => s.hasMention);
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const anyMention = Object.values(hasMention).some(Boolean);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User';
  const initials = getInitials(displayName);

  const navItems =
    orgRole === 'super_admin'
      ? superAdminNavItems
      : orgRole === 'team_admin'
        ? teamAdminNavItems
        : memberNavItems;
  const roleLabel = orgRole === 'super_admin'
    ? 'Super Admin'
    : orgRole === 'team_admin'
      ? 'Team Admin'
      : 'Member';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    const { error } = await updateProfile({ full_name: nameValue.trim() });
    if (error) {
      toast.error('Failed to update name');
    } else {
      toast.success('Name updated');
      setEditingName(false);
    }
  };

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
          {navItems.map(({ to, label, icon: Icon }) => {
            const isChat = to === '/my-team';
            const badgeCount = isChat ? totalUnread : 0;
            const isMentionHere = isChat && anyMention;

            return (
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
                {/* Icon with dot badge when collapsed */}
                <div className="relative shrink-0">
                  <Icon className="h-5 w-5" />
                  {isChat && badgeCount > 0 && collapsed && !mobile && (
                    <span className={clsx(
                      'absolute -top-1 -right-1 w-2 h-2 rounded-full',
                      isMentionHere ? 'bg-yellow-400' : 'bg-red-500'
                    )} />
                  )}
                </div>

                {/* Label + badge when expanded */}
                {(!collapsed || mobile) && (
                  <>
                    <span className="whitespace-nowrap flex-1">{label}</span>
                    {isChat && badgeCount > 0 && (
                      <span className={clsx(
                        'min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 text-[10px] font-bold text-white leading-none',
                        isMentionHere ? 'bg-yellow-500' : 'bg-red-500'
                      )}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        {!mobile && (
          <button
            onClick={onToggle}
            className="mx-3 mb-2 flex items-center justify-center rounded-lg p-2 text-surface-400 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
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
              'flex items-center rounded-lg p-2 transition-colors',
              collapsed && !mobile ? 'justify-center' : 'gap-3'
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-400 text-xs font-semibold text-white">
              {initials}
            </div>
            {(!collapsed || mobile) && (
              <div className="flex-1 overflow-hidden min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') setEditingName(false);
                      }}
                      className="w-full bg-white/10 text-white text-sm rounded px-1.5 py-0.5 outline-none border border-white/20 focus:border-primary-400"
                    />
                    <button onClick={handleSaveName} className="shrink-0 text-green-400 hover:text-green-300 cursor-pointer"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setEditingName(false)} className="shrink-0 text-surface-400 hover:text-white cursor-pointer"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-1 min-w-0">
                    <p className="truncate text-sm font-medium text-white">{displayName}</p>
                    <button
                      onClick={() => { setNameValue(displayName); setEditingName(true); }}
                      className="shrink-0 text-surface-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Edit name"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <p className="truncate text-xs text-surface-400">
                  {roleLabel}
                </p>
              </div>
            )}
            {(!collapsed || mobile) && !editingName && (
              <button
                onClick={handleSignOut}
                className="shrink-0 text-surface-400 transition-colors hover:text-white cursor-pointer"
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
