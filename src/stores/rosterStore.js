import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { ROSTER_STATUS } from '@/lib/constants';

const useRosterStore = create((set) => ({
  // ── State ───────────────────────────────────────────────────────────────────
  rosters: [],
  currentRoster: null,
  events: [],
  assignments: [],
  loading: false,

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Fetch all rosters belonging to a team.
   */
  fetchRosters: async (teamId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('rosters')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ rosters: data ?? [] });
      return { data: data ?? [], error: null };
    } catch (err) {
      console.error('Failed to fetch rosters:', err.message);
      return { data: [], error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Fetch a single roster by ID, including its events.
   */
  fetchRoster: async (rosterId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('rosters')
        .select(`
          *,
          events:roster_events(*)
        `)
        .eq('id', rosterId)
        .single();

      if (error) throw error;
      set({
        currentRoster: data,
        events: data?.events ?? [],
      });
      return { data, error: null };
    } catch (err) {
      console.error('Failed to fetch roster:', err.message);
      return { data: null, error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Create a new roster (defaults to DRAFT status).
   */
  createRoster: async (data) => {
    set({ loading: true });
    try {
      const { data: roster, error } = await supabase
        .from('rosters')
        .insert({ ...data, status: data.status || ROSTER_STATUS.DRAFT })
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ rosters: [roster, ...state.rosters] }));
      return { data: roster, error: null };
    } catch (err) {
      console.error('Failed to create roster:', err.message);
      return { data: null, error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Update a roster.
   */
  updateRoster: async (rosterId, updates) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('rosters')
        .update(updates)
        .eq('id', rosterId)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        currentRoster: state.currentRoster?.id === rosterId ? data : state.currentRoster,
        rosters: state.rosters.map((r) => (r.id === rosterId ? data : r)),
      }));
      return { data, error: null };
    } catch (err) {
      console.error('Failed to update roster:', err.message);
      return { data: null, error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Delete a roster by ID.
   */
  deleteRoster: async (rosterId) => {
    set({ loading: true });
    try {
      const { error } = await supabase
        .from('rosters')
        .delete()
        .eq('id', rosterId);

      if (error) throw error;
      set((state) => ({
        rosters: state.rosters.filter((r) => r.id !== rosterId),
        currentRoster: state.currentRoster?.id === rosterId ? null : state.currentRoster,
      }));
      return { error: null };
    } catch (err) {
      console.error('Failed to delete roster:', err.message);
      return { error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Publish a draft roster (set status to PUBLISHED and record the timestamp).
   */
  publishRoster: async (rosterId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('rosters')
        .update({
          status: ROSTER_STATUS.PUBLISHED,
          published_at: new Date().toISOString(),
        })
        .eq('id', rosterId)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        currentRoster: state.currentRoster?.id === rosterId ? data : state.currentRoster,
        rosters: state.rosters.map((r) => (r.id === rosterId ? data : r)),
      }));
      return { data, error: null };
    } catch (err) {
      console.error('Failed to publish roster:', err.message);
      return { data: null, error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Fetch all assignments for a roster (with member profile data).
   */
  fetchAssignments: async (rosterId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('roster_assignments')
        .select(`
          *,
          profile:profiles(*),
          role:team_roles(*)
        `)
        .eq('roster_id', rosterId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ assignments: data ?? [] });
      return { data: data ?? [], error: null };
    } catch (err) {
      console.error('Failed to fetch assignments:', err.message);
      return { data: [], error: err };
    } finally {
      set({ loading: false });
    }
  },
}));

export default useRosterStore;
