import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';

/**
 * Route guard that only allows super_admin users.
 * team_admin and member are redirected to /dashboard.
 */
export default function RequireSuperAdmin({ children }) {
  const { orgRole, initialized, user } = useAuthStore();

  if (!initialized) return null;

  // User is confirmed logged in but org membership hasn't loaded yet — hold
  if (user && orgRole === null) return null;

  if (orgRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children ?? <Outlet />;
}
