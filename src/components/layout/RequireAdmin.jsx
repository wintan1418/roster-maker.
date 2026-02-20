import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';

/**
 * Route guard that redirects non-admin users to /dashboard.
 * Use either as a wrapper or a layout route.
 *
 * As a layout route:
 *   <Route element={<RequireAdmin />}>
 *     <Route path="/teams" element={<TeamsPage />} />
 *   </Route>
 *
 * As a wrapper:
 *   <RequireAdmin><TeamsPage /></RequireAdmin>
 */
export default function RequireAdmin({ children }) {
    const { orgRole, initialized, user } = useAuthStore();

    // Wait for auth to initialize
    if (!initialized) return null;

    // User is confirmed logged in but org membership hasn't loaded yet — hold
    if (user && orgRole === null) return null;

    const isAdmin = orgRole === 'super_admin' || orgRole === 'team_admin';

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children ?? <Outlet />;
}
