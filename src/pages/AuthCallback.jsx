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

    async function processSignIn(session) {
      const user = session.user;

      try {
        // Check for pending invitations for this email
        const { data: invitations } = await supabase
          .from('invitations')
          .select('*')
          .eq('email', user.email.toLowerCase())
          .eq('status', 'pending');

        if (invitations?.length > 0) {
          for (const invite of invitations) {
            // Add to org
            if (invite.org_id) {
              await supabase
                .from('org_members')
                .upsert(
                  { organization_id: invite.org_id, user_id: user.id, role: invite.role || 'member' },
                  { onConflict: 'organization_id,user_id' }
                );
            }

            // Add to team
            if (invite.team_id) {
              await supabase
                .from('team_members')
                .upsert(
                  { team_id: invite.team_id, user_id: user.id },
                  { onConflict: 'team_id,user_id' }
                );
            }

            // Mark invitation accepted
            await supabase
              .from('invitations')
              .update({ status: 'accepted' })
              .eq('id', invite.id);
          }
        }
      } catch (err) {
        console.error('Failed to process invitation:', err.message);
      }

      navigate('/dashboard', { replace: true });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          subscription.unsubscribe();
          processSignIn(session);
        }
      }
    );

    // Also check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        processSignIn(session);
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
