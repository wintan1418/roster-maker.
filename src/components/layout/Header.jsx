import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, ChevronDown, User, LogOut } from 'lucide-react';
import clsx from 'clsx';

export default function Header({ title = 'Dashboard', onMenuToggle }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-surface-200 bg-white px-4 sm:px-6">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 md:hidden"
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
          className="relative rounded-lg p-2 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700"
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
              'flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-100',
              dropdownOpen && 'bg-surface-100'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-white">
              JD
            </div>
            <span className="hidden text-sm font-medium text-surface-700 sm:block">
              John Doe
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
            <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-surface-200 bg-white py-1 shadow-lg">
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-surface-700 transition-colors hover:bg-surface-50">
                <User className="h-4 w-4" />
                Profile
              </button>
              <hr className="my-1 border-surface-100" />
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-error transition-colors hover:bg-red-50">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
