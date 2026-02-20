import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

const noSupabase = { data: null, error: new Error('Supabase not configured') };

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  orgId: null,
  orgRole: null,
  loading: false,
  initialized: false,

  initialize: () => {
    if (!supabase) {
      set({ initialized: true });
      return () => {};
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        set({ user });

        if (user) {
          setTimeout(async () => {
            await get().fetchProfile(user.id);
            await get().fetchOrgMembership(user.id);
          }, 0);
        } else {
          set({ profile: null, orgId: null, orgRole: null });
        }

        if (!get().initialized) {
          set({ initialized: true });
        }
      }
    );

    return subscription.unsubscribe;
  },

  fetchProfile: async (userId) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      set({ profile: data });
    } catch (err) {
      console.error('Failed to fetch profile:', err.message);
    }
  },

  fetchOrgMembership: async (userId) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('org_members')
        .select('organization_id, role')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (error) throw error;
      set({ orgId: data.organization_id, orgRole: data.role });
    } catch (err) {
      // User may not have an org yet (fresh signup that failed org creation)
      console.warn('No org membership found:', err.message);
      set({ orgId: null, orgRole: null });
    }
  },

  signUp: async (email, password, fullName) => {
    if (!supabase) return noSupabase;
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    if (!supabase) return noSupabase;
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    } finally {
      set({ loading: false });
    }
  },

  signInWithMagicLink: async (email) => {
    if (!supabase) return noSupabase;
    set({ loading: true });
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    if (!supabase) {
      set({ user: null, profile: null });
      return;
    }
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, profile: null });
    } catch (err) {
      console.error('Sign-out failed:', err.message);
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Look up a user's email by their phone number.
   * Used for phone-based magic link login.
   */
  lookupByPhone: async (phone) => {
    if (!supabase) return { email: null, error: new Error('Supabase not configured') };
    try {
      // Normalize: strip spaces, dashes
      const normalized = phone.replace(/[\s\-()]/g, '');
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .or(`phone.eq.${normalized},phone.eq.${phone.trim()}`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return { email: null, error: new Error('No account found with that phone number') };
      return { email: data.email, error: null };
    } catch (err) {
      return { email: null, error: err };
    }
  },
}));

export default useAuthStore;
