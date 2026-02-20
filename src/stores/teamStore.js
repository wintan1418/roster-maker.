import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

const useTeamStore = create((set, get) => ({
  teams: [],
  currentTeam: null,
  members: [],
  roles: [],
  loading: false,

  fetchTeams: async (orgId) => {
    if (!supabase || !orgId) return { data: [], error: null };
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*, team_members(id, user_id, is_team_admin, profile:profiles(full_name, avatar_url)), team_roles(id)')
        .eq('org_id', orgId)
        .order('name', { ascending: true });

      if (error) throw error;

      // Flatten for TeamCard: attach members[] and roles[] arrays
      const teams = (data ?? []).map((t) => ({
        ...t,
        members: (t.team_members ?? []).map((tm) => ({
          id: tm.id,
          user_id: tm.user_id,
          is_admin: tm.is_team_admin,
          name: tm.profile?.full_name || 'Unknown',
          avatar_url: tm.profile?.avatar_url || '',
        })),
        roles: t.team_roles ?? [],
      }));

      set({ teams });
      return { data: teams, error: null };
    } catch (err) {
      console.error('Failed to fetch teams:', err.message);
      return { data: [], error: err };
    } finally {
      set({ loading: false });
    }
  },

  fetchTeam: async (teamId) => {
    if (!supabase) return { data: null, error: null };
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

  createTeam: async (teamData) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    set({ loading: true });
    try {
      const { data: team, error } = await supabase
        .from('teams')
        .insert(teamData)
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

  updateTeam: async (teamId, updates) => {
    if (!supabase) return { data: null, error: null };
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

  deleteTeam: async (teamId) => {
    if (!supabase) return { error: null };
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

  fetchTeamMembers: async (teamId) => {
    if (!supabase) return { data: [], error: null };
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profile:profiles(id, full_name, email, phone, avatar_url),
          member_roles(id, team_role_id, team_role:team_roles(id, name, category))
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten so components get { id, name, email, roles, roleIds, ... } shape
      const members = (data ?? []).map((tm) => ({
        id: tm.id,
        user_id: tm.user_id,
        team_id: tm.team_id,
        is_admin: tm.is_team_admin,
        name: tm.profile?.full_name || 'Unknown',
        email: tm.profile?.email || '',
        phone: tm.profile?.phone || '',
        avatar_url: tm.profile?.avatar_url || '',
        created_at: tm.created_at,
        roleIds: (tm.member_roles ?? []).map((mr) => mr.team_role_id),
        roles: (tm.member_roles ?? [])
          .filter((mr) => mr.team_role)
          .map((mr) => ({ id: mr.team_role.id, name: mr.team_role.name, category: mr.team_role.category })),
      }));

      set({ members });
      return { data: members, error: null };
    } catch (err) {
      console.error('Failed to fetch team members:', err.message);
      return { data: [], error: err };
    } finally {
      set({ loading: false });
    }
  },

  fetchTeamRoles: async (teamId) => {
    if (!supabase) return { data: [], error: null };
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('team_roles')
        .select('*')
        .eq('team_id', teamId)
        .order('sort_order', { ascending: true });

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

  addTeamRole: async (teamId, roleData) => {
    if (!supabase) return { data: null, error: null };
    try {
      const { data, error } = await supabase
        .from('team_roles')
        .insert({ team_id: teamId, ...roleData })
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ roles: [...state.roles, data] }));
      return { data, error: null };
    } catch (err) {
      console.error('Failed to add role:', err.message);
      return { data: null, error: err };
    }
  },

  updateTeamRole: async (roleId, updates) => {
    if (!supabase) return { data: null, error: null };
    try {
      const { data, error } = await supabase
        .from('team_roles')
        .update(updates)
        .eq('id', roleId)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        roles: state.roles.map((r) => (r.id === roleId ? data : r)),
      }));
      return { data, error: null };
    } catch (err) {
      console.error('Failed to update role:', err.message);
      return { data: null, error: err };
    }
  },

  deleteTeamRole: async (roleId) => {
    if (!supabase) return { error: null };
    try {
      const { error } = await supabase
        .from('team_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      set((state) => ({
        roles: state.roles.filter((r) => r.id !== roleId),
      }));
      return { error: null };
    } catch (err) {
      console.error('Failed to delete role:', err.message);
      return { error: err };
    }
  },

  updateMemberRoles: async (memberId, roleIds) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    try {
      // Delete all existing member_roles for this member
      const { error: delErr } = await supabase
        .from('member_roles')
        .delete()
        .eq('team_member_id', memberId);

      if (delErr) throw delErr;

      // Insert new roles
      if (roleIds.length > 0) {
        const rows = roleIds.map((rid) => ({
          team_member_id: memberId,
          team_role_id: rid,
        }));
        const { error: insErr } = await supabase
          .from('member_roles')
          .insert(rows);

        if (insErr) throw insErr;
      }

      // Update the member in local state
      set((state) => ({
        members: state.members.map((m) => {
          if (m.id !== memberId) return m;
          // Re-derive roles from the store's roles list
          const teamRoles = state.roles || [];
          return {
            ...m,
            roleIds,
            roles: roleIds
              .map((rid) => teamRoles.find((r) => r.id === rid))
              .filter(Boolean)
              .map((r) => ({ id: r.id, name: r.name, category: r.category })),
          };
        }),
      }));

      return { error: null };
    } catch (err) {
      console.error('Failed to update member roles:', err.message);
      return { error: err };
    }
  },

  fetchTeamInvitations: async (teamId) => {
    if (!supabase) return { data: [], error: null };
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('id, email, full_name, role, status, created_at, team_id, org_id')
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data ?? [], error: null };
    } catch (err) {
      console.error('Failed to fetch invitations:', err.message);
      return { data: [], error: err };
    }
  },

  resendInvitation: async (email, fullName) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    try {
      await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: fullName },
        },
      });
      return { error: null };
    } catch (err) {
      console.error('Failed to resend invitation:', err.message);
      return { error: err };
    }
  },

  cancelInvitation: async (invitationId) => {
    if (!supabase) return { error: null };
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.error('Failed to cancel invitation:', err.message);
      return { error: err };
    }
  },

  addBulkRoles: async (teamId, roles) => {
    if (!supabase || roles.length === 0) return { data: [], error: null };
    try {
      const rows = roles.map((r, i) => ({
        team_id: teamId,
        name: r.name,
        category: r.category || null,
        min_required: r.min_required ?? 1,
        max_allowed: r.max_allowed ?? null,
        sort_order: i,
      }));
      const { data, error } = await supabase
        .from('team_roles')
        .insert(rows)
        .select();

      if (error) throw error;
      set((state) => ({ roles: [...state.roles, ...(data ?? [])] }));
      return { data: data ?? [], error: null };
    } catch (err) {
      console.error('Failed to bulk add roles:', err.message);
      return { data: [], error: err };
    }
  },

  /**
   * Bulk add members to a team.
   * For each member: upsert profile → upsert org_member → insert team_member → insert member_roles.
   * Then sends invite emails via the bulk-invite Edge Function.
   */
  addBulkMembers: async (teamId, orgId, members, roleIds = []) => {
    if (!supabase || members.length === 0) return { data: [], error: null };
    set({ loading: true });

    const added = [];
    const errors = [];

    for (const member of members) {
      try {
        // 1. Upsert profile (check if exists by email)
        let userId;
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', member.email.toLowerCase())
          .maybeSingle();

        if (existingProfile) {
          userId = existingProfile.id;
          // Update name/phone if provided
          await supabase
            .from('profiles')
            .update({
              full_name: member.name || existingProfile.full_name,
              phone: member.phone || existingProfile.phone,
            })
            .eq('id', userId);
        } else {
          // No account yet — create an invitation record so they are
          // auto-added to the team when they first sign in.
          const token = crypto.randomUUID();
          await supabase.from('invitations').upsert(
            {
              org_id: orgId,
              team_id: teamId,
              email: member.email.toLowerCase(),
              full_name: member.name,
              role: 'member',
              token,
              status: 'pending',
            },
            { onConflict: 'token' }
          );

          // Send magic link so they can log in without a password
          await supabase.auth.signInWithOtp({
            email: member.email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: { full_name: member.name },
            },
          });

          added.push({ ...member, status: 'invite_pending' });
          continue;
        }

        // 2. Upsert org_member
        await supabase
          .from('org_members')
          .upsert(
            { organization_id: orgId, user_id: userId, role: 'member' },
            { onConflict: 'organization_id,user_id' }
          );

        // 3. Insert team_member (ignore if exists)
        const { data: teamMember, error: tmError } = await supabase
          .from('team_members')
          .upsert(
            { team_id: teamId, user_id: userId },
            { onConflict: 'team_id,user_id' }
          )
          .select('id')
          .single();

        if (tmError) throw tmError;

        // 4. Insert member_roles
        if (roleIds.length > 0 && teamMember) {
          const mrRows = roleIds.map((roleId) => ({
            team_member_id: teamMember.id,
            team_role_id: roleId,
          }));
          await supabase
            .from('member_roles')
            .upsert(mrRows, { onConflict: 'team_member_id,team_role_id' });
        }

        added.push({ ...member, userId, status: 'added' });
      } catch (err) {
        console.error(`Failed to add ${member.email}:`, err.message);
        errors.push({ email: member.email, error: err.message });
      }
    }

    // Refresh team members list
    await get().fetchTeamMembers(teamId);

    set({ loading: false });
    return { data: added, errors };
  },
}));

export default useTeamStore;
