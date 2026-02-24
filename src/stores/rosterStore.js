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
    if (!supabase) return { data: [], error: null };
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
   * Fetch all rosters across all teams in an org.
   */
  fetchOrgRosters: async (orgId) => {
    if (!supabase || !orgId) return { data: [], error: null };
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('rosters')
        .select('*, team:teams!inner(id, name), events:roster_events(id)')
        .eq('team.org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rosters = (data ?? []).map((r) => ({
          ...r,
          team_name: r.team?.name || 'Unknown Team',
        }));
      set({ rosters });
      return { data: rosters, error: null };
    } catch (err) {
      console.error('Failed to fetch org rosters:', err.message);
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
  publishRoster: async (rosterId, shareToken = null) => {
    set({ loading: true });
    try {
      const updates = {
        status: ROSTER_STATUS.PUBLISHED,
        published_at: new Date().toISOString(),
      };
      if (shareToken) {
        updates.share_token = shareToken;
      }

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
      console.error('Failed to publish roster:', err.message);
      return { data: null, error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Save assignments to the roster's signature_fields JSONB column.
   * Format: { roleConfig: [...], assignments: { "eventId-roleSlotId": { memberId, manual } } }
   */
  saveAssignments: async (rosterId, assignments, roleConfig = null) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    try {
      // Fetch current signature_fields to preserve roleConfig if not provided
      let currentRoleConfig = roleConfig;
      if (!currentRoleConfig) {
        const { data: roster } = await supabase
          .from('rosters')
          .select('signature_fields')
          .eq('id', rosterId)
          .single();

        const sf = roster?.signature_fields;
        if (Array.isArray(sf)) {
          currentRoleConfig = sf;
        } else if (sf?.roleConfig) {
          currentRoleConfig = sf.roleConfig;
        } else {
          currentRoleConfig = [];
        }
      }

      const payload = { roleConfig: currentRoleConfig, assignments };

      const { error } = await supabase
        .from('rosters')
        .update({ signature_fields: payload })
        .eq('id', rosterId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.error('Failed to save assignments:', err.message);
      return { error: err };
    }
  },
  /**
   * Fetch a published roster by its share token (for the public page).
   * Returns roster + events + team + team members with profiles.
   */
  fetchPublicRoster: async (shareToken) => {
    if (!supabase || !shareToken) return { data: null, error: new Error('Missing token') };
    set({ loading: true });
    try {
      // 1. Fetch roster by share_token
      const { data: roster, error: rosterErr } = await supabase
        .from('rosters')
        .select(`
          *,
          events:roster_events(*),
          team:teams(id, name, org_id, organization:organizations(name))
        `)
        .eq('share_token', shareToken)
        .eq('status', 'published')
        .single();

      if (rosterErr) throw rosterErr;
      if (!roster) throw new Error('Roster not found');

      // 2. Fetch team members with profiles
      let members = [];
      if (roster.team_id) {
        const { data: memberData } = await supabase
          .from('team_members')
          .select(`
            *,
            profile:profiles(id, full_name, email, phone, avatar_url),
            member_roles(id, team_role_id, team_role:team_roles(id, name, category))
          `)
          .eq('team_id', roster.team_id);

        members = (memberData ?? []).map((tm) => ({
          id: tm.id,
          user_id: tm.user_id,
          name: tm.profile?.full_name || 'Unknown',
          email: tm.profile?.email || '',
          phone: tm.profile?.phone || '',
          avatar_url: tm.profile?.avatar_url || '',
          roleIds: (tm.member_roles ?? []).map((mr) => mr.team_role_id),
          roles: (tm.member_roles ?? [])
            .filter((mr) => mr.team_role)
            .map((mr) => ({ id: mr.team_role.id, name: mr.team_role.name, category: mr.team_role.category })),
        }));
      }

      // 3. Parse signature_fields for roleConfig + assignments
      const sf = roster.signature_fields;
      let roleConfig = [];
      let assignments = {};
      if (Array.isArray(sf)) {
        roleConfig = sf;
      } else if (sf && typeof sf === 'object') {
        roleConfig = sf.roleConfig || [];
        assignments = sf.assignments || {};
      }

      return {
        data: {
          roster,
          events: (roster.events ?? []).sort((a, b) =>
            (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.event_date.localeCompare(b.event_date)
          ),
          team: roster.team,
          organization: roster.team?.organization,
          roleConfig,
          assignments,
          members,
        },
        error: null,
      };
    } catch (err) {
      console.error('Failed to fetch public roster:', err.message);
      return { data: null, error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Fetch a roster by its review token (for the public review page).
   * Works for any status (draft, published, archived).
   */
  fetchReviewRoster: async (reviewToken) => {
    if (!supabase || !reviewToken) return { data: null, error: new Error('Missing token') };
    set({ loading: true });
    try {
      const { data: roster, error: rosterErr } = await supabase
        .from('rosters')
        .select(`
          *,
          events:roster_events(*),
          team:teams(id, name, org_id, organization:organizations(name))
        `)
        .eq('review_token', reviewToken)
        .single();

      if (rosterErr) throw rosterErr;
      if (!roster) throw new Error('Roster not found');

      let members = [];
      if (roster.team_id) {
        const { data: memberData } = await supabase
          .from('team_members')
          .select(`
            *,
            profile:profiles(id, full_name, email, phone, avatar_url),
            member_roles(id, team_role_id, team_role:team_roles(id, name, category))
          `)
          .eq('team_id', roster.team_id);

        members = (memberData ?? []).map((tm) => ({
          id: tm.id,
          user_id: tm.user_id,
          name: tm.profile?.full_name || 'Unknown',
          email: tm.profile?.email || '',
          phone: tm.profile?.phone || '',
          avatar_url: tm.profile?.avatar_url || '',
          roleIds: (tm.member_roles ?? []).map((mr) => mr.team_role_id),
          roles: (tm.member_roles ?? [])
            .filter((mr) => mr.team_role)
            .map((mr) => ({ id: mr.team_role.id, name: mr.team_role.name, category: mr.team_role.category })),
        }));
      }

      const sf = roster.signature_fields;
      let roleConfig = [];
      let assignments = {};
      let guests = [];
      if (Array.isArray(sf)) {
        roleConfig = sf;
      } else if (sf && typeof sf === 'object') {
        roleConfig = sf.roleConfig || [];
        assignments = sf.assignments || {};
        guests = sf.guests || [];
      }

      const { data: reviews } = await supabase
        .from('roster_reviews')
        .select('*')
        .eq('roster_id', roster.id)
        .order('created_at', { ascending: true });

      return {
        data: {
          roster,
          events: (roster.events ?? []).sort((a, b) =>
            (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.event_date.localeCompare(b.event_date)
          ),
          team: roster.team,
          organization: roster.team?.organization,
          roleConfig,
          assignments,
          members,
          guests,
          reviews: reviews ?? [],
        },
        error: null,
      };
    } catch (err) {
      console.error('Failed to fetch review roster:', err.message);
      return { data: null, error: err };
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Submit a review for a roster (used by external reviewers).
   */
  submitReview: async (rosterId, reviewerName, comment, status) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    try {
      const { data, error } = await supabase
        .from('roster_reviews')
        .insert({
          roster_id: rosterId,
          reviewer_name: reviewerName,
          comment: comment || null,
          status,
        })
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  /**
   * Fetch reviews for a roster (admin view).
   */
  fetchRosterReviews: async (rosterId) => {
    if (!supabase) return { data: [], error: null };
    try {
      const { data, error } = await supabase
        .from('roster_reviews')
        .select('*')
        .eq('roster_id', rosterId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { data: data ?? [], error: null };
    } catch (err) {
      return { data: [], error: err };
    }
  },
}));

export default useRosterStore;
