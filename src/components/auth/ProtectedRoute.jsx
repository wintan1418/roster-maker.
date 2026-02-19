import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

/**
 * Route guard that wraps protected pages.
 *
 * Props:
 *   - children      The protected page content.
 *   - requiredRole  Optional role string (e.g. 'super_admin', 'team_admin').
 *                   When set, users without that role (or a higher one) are
 *                   redirected to /dashboard.
 *
 * Usage in your router config:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 *   <Route element={<ProtectedRoute requiredRole="super_admin" />}>
 *     <Route path="/admin" element={<Admin />} />
 *   </Route>
 */

const ROLE_HIERARCHY = {
  super_admin: 3,
  team_admin: 2,
  member: 1,
};

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, initialized } = useAuthStore();
  const location = useLocation();

  // ── Still loading the initial session check ──────────────────────────────
  if (!initialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-sm text-surface-500">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Not authenticated -> send to login ───────────────────────────────────
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Optional role check ──────────────────────────────────────────────────
  if (requiredRole && profile) {
    const userLevel = ROLE_HIERARCHY[profile.role] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;

    if (userLevel < requiredLevel) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
