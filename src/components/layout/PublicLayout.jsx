import { Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      {/* Top branding bar */}
      <header className="flex h-14 items-center justify-center border-b border-surface-200 bg-white">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-xs font-bold text-white">
            RF
          </div>
          <span className="text-lg font-semibold text-surface-900 tracking-tight">
            RosterFlow
          </span>
        </Link>
      </header>

      {/* Centered content card */}
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-4xl rounded-2xl border border-surface-200 bg-white p-6 shadow-sm sm:p-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-200 bg-white py-4 text-center text-sm text-surface-500">
        <p>
          Powered by{' '}
          <Link to="/" className="font-medium text-primary-600 hover:text-primary-700">
            RosterFlow
          </Link>{' '}
          &mdash; Effortless Duty Rosters
        </p>
      </footer>
    </div>
  );
}
