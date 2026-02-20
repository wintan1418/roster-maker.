import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * Handles the redirect after a magic link.
 * Also processes any pending team invitations for the user's email.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      navigate('/login');
      return;
    }

    async function processSignIn() {
      try {
        // Server-side function bypasses RLS — safely adds user to org + team
        await supabase.rpc('accept_pending_invitations');
      } catch (err) {
        console.error('Failed to process invitation:', err.message);
      }

      navigate('/dashboard', { replace: true });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          subscription.unsubscribe();
          processSignIn();
        }
      }
    );

    // Also check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        processSignIn();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface-50">
      <Loader2 size={36} className="animate-spin text-primary-500" />
      <p className="text-surface-500 text-sm">Signing you in...</p>
    </div>
  );
}
