import { useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/LoadingSpinner';
import TeamDetail from '@/components/teams/TeamDetail';
import useTeamStore from '@/stores/teamStore';

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
    updateTeam,
    deleteTeam,
    addTeamRole,
    updateTeamRole,
    deleteTeamRole,
    addBulkRoles,
  } = useTeamStore();

  // ── Fetch data on mount ───────────────────────────────────────────────────

  useEffect(() => {
    if (!teamId) return;
    fetchTeam(teamId);
    fetchTeamMembers(teamId);
    fetchTeamRoles(teamId);
  }, [teamId, fetchTeam, fetchTeamMembers, fetchTeamRoles]);

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

  const handleAddMember = useCallback(async () => {
    toast('Member management coming soon', { icon: '\u2139\uFE0F' });
  }, []);

  const handleRemoveMember = useCallback(async () => {
    toast('Member management coming soon', { icon: '\u2139\uFE0F' });
  }, []);

  const handleToggleAdmin = useCallback(async () => {
    toast('Member management coming soon', { icon: '\u2139\uFE0F' });
  }, []);

  const handleUpdateMemberRoles = useCallback(async () => {
    toast('Member role management coming soon', { icon: '\u2139\uFE0F' });
  }, []);

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
        onUpdateTeam={handleUpdateTeam}
        onDeleteTeam={handleDeleteTeam}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        onToggleAdmin={handleToggleAdmin}
        onUpdateMemberRoles={handleUpdateMemberRoles}
        onAddRole={handleAddRole}
        onEditRole={handleEditRole}
        onDeleteRole={handleDeleteRole}
        onLoadTemplate={handleLoadTemplate}
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
