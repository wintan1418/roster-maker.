import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/LoadingSpinner';
import TeamDetail from '@/components/teams/TeamDetail';
import useTeamStore from '@/stores/teamStore';
import useAuthStore from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const {
    currentTeam: team,
    members,
    roles,
    loading,
    fetchTeam,
    fetchTeamMembers,
    fetchTeamRoles,
    fetchTeamInvitations,
    resendInvitation,
    cancelInvitation,
    updateTeam,
    deleteTeam,
    addTeamRole,
    updateTeamRole,
    deleteTeamRole,
    addBulkRoles,
    addBulkMembers,
  } = useTeamStore();

  const { orgId, orgRole } = useAuthStore();
  const [invitations, setInvitations] = useState([]);
  const [adminUserIds, setAdminUserIds] = useState([]);

  // ── Fetch data on mount ───────────────────────────────────────────────────

  const loadInvitations = useCallback(async () => {
    if (!teamId) return;
    try {
      const { data } = await fetchTeamInvitations(teamId);
      setInvitations(data ?? []);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    }
  }, [teamId, fetchTeamInvitations]);

  useEffect(() => {
    if (!teamId) return;
    fetchTeam(teamId);
    fetchTeamMembers(teamId);
    fetchTeamRoles(teamId);
    loadInvitations();
  }, [teamId, fetchTeam, fetchTeamMembers, fetchTeamRoles, loadInvitations]);

  // Fetch which users have admin org roles
  useEffect(() => {
    if (!supabase || !orgId) return;
    supabase
      .from('org_members')
      .select('user_id, role')
      .eq('organization_id', orgId)
      .in('role', ['super_admin', 'team_admin'])
      .then(({ data }) => setAdminUserIds((data ?? []).map((om) => om.user_id)));
  }, [orgId]);

  const handleToggleAdmin = useCallback(async (member) => {
    if (!supabase || !orgId) return;
    const isAdmin = adminUserIds.includes(member.user_id);
    const newRole = isAdmin ? 'member' : 'team_admin';
    try {
      const { error } = await supabase
        .from('org_members')
        .update({ role: newRole })
        .eq('organization_id', orgId)
        .eq('user_id', member.user_id);
      if (error) throw error;
      setAdminUserIds((prev) =>
        newRole === 'team_admin'
          ? [...prev, member.user_id]
          : prev.filter((id) => id !== member.user_id)
      );
      toast.success(
        newRole === 'team_admin'
          ? `${member.name} is now a Team Admin`
          : `${member.name} is now a Member`
      );
    } catch (err) {
      toast.error('Failed to update admin status');
    }
  }, [orgId, adminUserIds]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleUpdateTeam = useCallback(
    async (updates) => {
      const { error } = await updateTeam(teamId, updates);
      if (error) {
        toast.error('Failed to update team');
      } else {
        toast.success('Team updated');
      }
    },
    [teamId, updateTeam]
  );

  const handleDeleteTeam = useCallback(async () => {
    const { error } = await deleteTeam(teamId);
    if (error) {
      toast.error('Failed to delete team');
    } else {
      toast.success('Team deleted');
      navigate('/teams');
    }
  }, [teamId, deleteTeam, navigate]);

  const handleAddMember = useCallback(async (memberData) => {
    const { errors } = await addBulkMembers(
      teamId,
      orgId,
      [{ name: memberData.name, email: memberData.email, phone: memberData.phone }],
      memberData.roles || []
    );
    if (errors?.length > 0) {
      toast.error('Failed to add member');
    } else {
      toast.success('Member added successfully');
    }
    loadInvitations();
  }, [teamId, orgId, addBulkMembers, loadInvitations]);

  const handleBulkAdd = useCallback(async (membersList, roleIds) => {
    const { errors } = await addBulkMembers(teamId, orgId, membersList, roleIds);
    if (errors?.length > 0) {
      toast.error(`${errors.length} member(s) failed to add`);
    }
    // Refresh invitations list to show newly created pending invites
    loadInvitations();
  }, [teamId, orgId, addBulkMembers, loadInvitations]);

  const handleResendInvitation = useCallback(async (email, fullName) => {
    const { error } = await resendInvitation(email, fullName);
    if (error) throw error;
  }, [resendInvitation]);

  const handleCancelInvitation = useCallback(async (invitationId) => {
    const { error } = await cancelInvitation(invitationId);
    if (error) throw error;
    setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
  }, [cancelInvitation]);

  const handleRemoveMember = useCallback(async (memberId) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;
      toast.success('Member removed');
      fetchTeamMembers(teamId);
    } catch (err) {
      toast.error('Failed to remove member');
    }
  }, [teamId, fetchTeamMembers]);

  const handleUpdateMemberRoles = useCallback(async (memberId, roleIds) => {
    if (!supabase) return;
    try {
      await supabase
        .from('member_roles')
        .delete()
        .eq('team_member_id', memberId);

      if (roleIds.length > 0) {
        const rows = roleIds.map((roleId) => ({
          team_member_id: memberId,
          team_role_id: roleId,
        }));
        const { error } = await supabase
          .from('member_roles')
          .insert(rows);
        if (error) throw error;
      }

      toast.success('Roles updated');
      fetchTeamMembers(teamId);
    } catch (err) {
      toast.error('Failed to update roles');
    }
  }, [teamId, fetchTeamMembers]);

  const handleAddRole = useCallback(
    async (roleData) => {
      const { error } = await addTeamRole(teamId, roleData);
      if (error) {
        toast.error('Failed to add role');
      } else {
        toast.success('Role added');
      }
    },
    [teamId, addTeamRole]
  );

  const handleEditRole = useCallback(
    async (roleId, updates) => {
      const { error } = await updateTeamRole(roleId, updates);
      if (error) {
        toast.error('Failed to update role');
      } else {
        toast.success('Role updated');
      }
    },
    [updateTeamRole]
  );

  const handleDeleteRole = useCallback(
    async (roleId) => {
      const { error } = await deleteTeamRole(roleId);
      if (error) {
        toast.error('Failed to delete role');
      } else {
        toast.success('Role deleted');
      }
    },
    [deleteTeamRole]
  );

  const handleRegenerateJoinToken = useCallback(async () => {
    if (!supabase) return;
    try {
      const newToken = crypto.randomUUID();
      await supabase.from('teams').update({ join_token: newToken }).eq('id', teamId);
      fetchTeam(teamId);
      toast.success('Join link regenerated');
    } catch {
      toast.error('Failed to regenerate link');
    }
  }, [teamId, fetchTeam]);

  const handleLoadTemplate = useCallback(
    async (templateRoles) => {
      const { error } = await addBulkRoles(teamId, templateRoles);
      if (error) {
        toast.error('Failed to load template roles');
      } else {
        toast.success('Template roles added');
      }
    },
    [teamId, addBulkRoles]
  );

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading && !team) {
    return (
      <div className="space-y-6">
        <Breadcrumb teamName={null} />
        <LoadingBlock />
      </div>
    );
  }

  // ── Not found state ───────────────────────────────────────────────────────

  if (!team) {
    return (
      <div className="space-y-6">
        <Breadcrumb teamName={null} />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-white p-12 text-center">
          <h2 className="text-lg font-semibold text-surface-900 mb-2">
            Team Not Found
          </h2>
          <p className="text-sm text-surface-500 mb-6">
            The team you are looking for does not exist or may have been deleted.
          </p>
          <Button variant="primary" onClick={() => navigate('/teams')}>
            Back to Teams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb teamName={team.name} />

      {/* Team detail */}
      <TeamDetail
        team={team}
        members={members}
        roles={roles}
        invitations={invitations}
        orgRole={orgRole}
        adminUserIds={adminUserIds}
        onToggleAdmin={handleToggleAdmin}
        onUpdateTeam={handleUpdateTeam}
        onDeleteTeam={handleDeleteTeam}
        onAddMember={handleAddMember}
        onBulkAddMembers={handleBulkAdd}
        onRemoveMember={handleRemoveMember}
        onUpdateMemberRoles={handleUpdateMemberRoles}
        onResendInvitation={handleResendInvitation}
        onCancelInvitation={handleCancelInvitation}
        onRegenerateJoinToken={handleRegenerateJoinToken}
        onAddRole={handleAddRole}
        onEditRole={handleEditRole}
        onDeleteRole={handleDeleteRole}
        onLoadTemplate={handleLoadTemplate}
        onRefresh={() => fetchTeamMembers(teamId)}
      />
    </div>
  );
}

function Breadcrumb({ teamName }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <Link
        to="/teams"
        className="flex items-center gap-1 text-surface-500 hover:text-primary-600 transition-colors duration-200"
      >
        <ArrowLeft size={14} />
        Teams
      </Link>
      {teamName && (
        <>
          <ChevronRight size={14} className="text-surface-300" />
          <span className="text-surface-800 font-medium truncate max-w-xs">
            {teamName}
          </span>
        </>
      )}
    </nav>
  );
}
