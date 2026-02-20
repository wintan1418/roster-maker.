import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown, User, LogOut, Check, X, Camera } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useAuthStore from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { getInitials } from '@/lib/utils';

export default function Header({ title = 'Dashboard', onMenuToggle }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, profile, orgRole, signOut, fetchProfile } = useAuthStore();

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User';
  const initials = getInitials(displayName);

  // Profile editing state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Populate edit fields when profile panel opens
  useEffect(() => {
    if (profileOpen && profile) {
      setEditName(profile.full_name || '');
      setEditPhone(profile.phone || '');
    }
  }, [profileOpen, profile]);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    navigate('/login');
  };

  const handleOpenProfile = () => {
    setDropdownOpen(false);
    setProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      if (supabase && user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: editName.trim(),
            phone: editPhone.trim() || null,
          })
          .eq('id', user.id);

        if (error) throw error;

        // Refresh profile in store
        await fetchProfile(user.id);
        toast.success('Profile updated!');
        setProfileOpen(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = orgRole === 'super_admin'
    ? 'Super Admin'
    : orgRole === 'team_admin'
      ? 'Team Admin'
      : 'Member';

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-surface-200 bg-white px-4 sm:px-6">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="rounded-lg p-2 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 md:hidden cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-surface-900 sm:text-xl">
            {title}
          </h1>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <button
            className="relative rounded-lg p-2 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-500" />
          </button>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={clsx(
                'flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-100 cursor-pointer',
                dropdownOpen && 'bg-surface-100'
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-white">
                {initials}
              </div>
              <span className="hidden text-sm font-medium text-surface-700 sm:block">
                {displayName}
              </span>
              <ChevronDown
                className={clsx(
                  'hidden h-4 w-4 text-surface-400 transition-transform sm:block',
                  dropdownOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-surface-200 bg-white py-1 shadow-lg z-50">
                <button
                  onClick={handleOpenProfile}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-surface-700 transition-colors hover:bg-surface-50 cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <hr className="my-1 border-surface-100" />
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-error transition-colors hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Profile Slide-over Panel ───────────────────────────────────────── */}
      {profileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 transition-opacity"
            onClick={() => setProfileOpen(false)}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">

            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="text-lg font-semibold text-surface-900">Your Profile</h2>
              <button
                onClick={() => setProfileOpen(false)}
                className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Avatar section */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary-500 text-white text-2xl font-bold">
                    {initials}
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-surface-900">{displayName}</p>
                <p className="text-xs text-surface-400">{profile?.email}</p>
                <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-50 text-primary-600 uppercase tracking-wide">
                  {roleLabel}
                </span>
              </div>

              {/* Edit form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-surface-500 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm text-surface-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-surface-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm text-surface-400 bg-surface-50 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-surface-400 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-surface-500 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm text-surface-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    placeholder="+234..."
                  />
                </div>
              </div>
            </div>

            {/* Panel footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-surface-200">
              <button
                onClick={() => setProfileOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-surface-200 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={14} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
