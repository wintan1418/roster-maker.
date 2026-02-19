import { Link } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
      <div className="max-w-md text-center">
        {/* Illustration */}
        <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-surface-100">
          <SearchX className="h-16 w-16 text-surface-400" />
        </div>

        <h1 className="text-7xl font-extrabold text-surface-900">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-surface-700">
          Page not found
        </h2>
        <p className="mt-3 text-surface-500">
          Sorry, we couldn't find the page you're looking for. It might have been
          moved or doesn't exist.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
        >
          <Home className="h-4 w-4" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
