import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

const useTeamStore = create((set) => ({
  // ── State ───────────────────────────────────────────────────────────────────
  teams: [],
  currentTeam: null,
  members: [],
  roles: [],
  loading: false,

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Fetch all teams in an organization.
   */
  fetchTeams: async (orgId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('organization_id', orgId)
        .order('name', { ascending: true });

      if (error) throw error;
      set({ teams: data ?? [] });
      return { data: data ?? [], error: null };
    } catch (err) {
      console.error('Failed to fetch teams:', err.message);
      return { data: [], error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Fetch a single team by ID.
   */
  fetchTeam: async (teamId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) throw error;
      set({ currentTeam: data });
      return { data, error: null };
    } catch (err) {
      console.error('Failed to fetch team:', err.message);
      return { data: null, error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Create a new team.
   */
  createTeam: async (data) => {
    set({ loading: true });
    try {
      const { data: team, error } = await supabase
        .from('teams')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ teams: [...state.teams, team] }));
      return { data: team, error: null };
    } catch (err) {
      console.error('Failed to create team:', err.message);
      return { data: null, error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Update an existing team.
   */
  updateTeam: async (teamId, updates) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        currentTeam: data,
        teams: state.teams.map((t) => (t.id === teamId ? data : t)),
      }));
      return { data, error: null };
    } catch (err) {
      console.error('Failed to update team:', err.message);
      return { data: null, error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Delete a team by ID.
   */
  deleteTeam: async (teamId) => {
    set({ loading: true });
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
      set((state) => ({
        teams: state.teams.filter((t) => t.id !== teamId),
        currentTeam: state.currentTeam?.id === teamId ? null : state.currentTeam,
      }));
      return { error: null };
    } catch (err) {
      console.error('Failed to delete team:', err.message);
      return { error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Fetch members of a specific team (via team_members join).
   */
  fetchTeamMembers: async (teamId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ members: data ?? [] });
      return { data: data ?? [], error: null };
    } catch (err) {
      console.error('Failed to fetch team members:', err.message);
      return { data: [], error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Fetch the defined roles for a team.
   */
  fetchTeamRoles: async (teamId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('team_roles')
        .select('*')
        .eq('team_id', teamId)
        .order('name', { ascending: true });

      if (error) throw error;
      set({ roles: data ?? [] });
      return { data: data ?? [], error: null };
    } catch (err) {
      console.error('Failed to fetch team roles:', err.message);
      return { data: [], error: err };
    } finally {
      set({ loading: false });
    }
  },
}));

export default useTeamStore;
