import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

const useOrgStore = create((set) => ({
  // ── State ───────────────────────────────────────────────────────────────────
  organization: null,
  members: [],
  loading: false,

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Fetch a single organization by ID.
   */
  fetchOrganization: async (orgId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (error) throw error;
      set({ organization: data });
      return { data, error: null };
    } catch (err) {
      console.error('Failed to fetch organization:', err.message);
      return { data: null, error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Create a new organization.
   */
  createOrganization: async (data) => {
    set({ loading: true });
    try {
      const { data: org, error } = await supabase
        .from('organizations')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      set({ organization: org });
      return { data: org, error: null };
    } catch (err) {
      console.error('Failed to create organization:', err.message);
      return { data: null, error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Update an existing organization.
   */
  updateOrganization: async (orgId, updates) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', orgId)
        .select()
        .single();

      if (error) throw error;
      set({ organization: data });
      return { data, error: null };
    } catch (err) {
      console.error('Failed to update organization:', err.message);
      return { data: null, error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Fetch all members belonging to an organization (via org_members join).
   */
  fetchMembers: async (orgId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('org_members')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ members: data ?? [] });
      return { data: data ?? [], error: null };
    } catch (err) {
      console.error('Failed to fetch org members:', err.message);
      return { data: [], error: err };
    } finally {
      set({ loading: false });
    }
  },
}));

export default useOrgStore;
