import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';

/**
 * Convenience hook that exposes the auth store and adds navigation helpers.
 *
 * Usage:
 *   const { user, profile, loading, handleSignOut } = useAuth();
 */
export default function useAuth() {
  const {
    user,
    profile,
    loading,
    initialized,
    initialize,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    fetchProfile,
  } = useAuthStore();

  const navigate = useNavigate();

  // Boot the auth listener once per app lifetime
  useEffect(() => {
    const unsubscribe = initialize();
    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Sign out and redirect to the login page.
   */
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  /**
   * True when the current user has a super_admin role on their profile.
   */
  const isSuperAdmin = profile?.role === 'super_admin';

  /**
   * True when the current user is at least a team_admin.
   */
  const isTeamAdmin =
    profile?.role === 'team_admin' || profile?.role === 'super_admin';

  /**
   * Check whether the user has a specific role (or any of the given roles).
   */
  const hasRole = (...roles) => roles.includes(profile?.role);

  return {
    user,
    profile,
    loading,
    initialized,
    isSuperAdmin,
    isTeamAdmin,
    hasRole,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut: handleSignOut,
    fetchProfile,
  };
}
