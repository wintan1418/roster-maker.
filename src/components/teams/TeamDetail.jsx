import { useState } from 'react';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Calendar,
  Pencil,
  Check,
  X,
  Trash2,
  Music,
  Church,
  Layers,
  Link2,
  Copy,
  RefreshCw,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import { formatDate } from '@/lib/utils';
import TeamMemberManager from '@/components/teams/TeamMemberManager';
import TeamRoleEditor from '@/components/teams/TeamRoleEditor';
import useAuthStore from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'members', label: 'Members', icon: Users },
  { key: 'roles', label: 'Roles', icon: ShieldCheck },
];

const templateConfig = {
  music: { label: 'Music / Worship', color: 'primary', icon: Music },
  church_event: { label: 'Church Event', color: 'success', icon: Church },
  custom: { label: 'Custom', color: 'default', icon: Layers },
};

export default function TeamDetail({
  team,
  members = [],
  roles = [],
  invitations = [],
  orgRole,
  adminUserIds = [],
  onToggleAdmin,
  onUpdateTeam,
  onDeleteTeam,
  onAddMember,
  onBulkAddMembers,
  onRemoveMember,
  onUpdateMemberRoles,
  onResendInvitation,
  onCancelInvitation,
  onAddRole,
  onEditRole,
  onDeleteRole,
  onLoadTemplate,
  onRegenerateJoinToken,
  onRefresh,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(team?.name || '');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [removeMembers, setRemoveMembers] = useState(false);

  if (!team) return null;

  const config = templateConfig[team.template_type] || templateConfig.custom;
  const TemplateIcon = config.icon;

  function handleSaveName() {
    if (!nameValue.trim()) {
      toast.error('Team name cannot be empty');
      return;
    }
    onUpdateTeam?.({ name: nameValue.trim() });
    toast.success('Team name updated');
    setEditingName(false);
  }

  function handleCancelName() {
    setNameValue(team.name);
    setEditingName(false);
  }

  function handleDelete() {
    onDeleteTeam?.(removeMembers);
    setDeleteOpen(false);
    setRemoveMembers(false);
  }

  return (
    <div className="space-y-6">
      {/* Team header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          {/* Editable team name */}
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="text-xl font-bold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancelName();
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                iconLeft={Check}
                onClick={handleSaveName}
              />
              <Button
                variant="ghost"
                size="sm"
                iconLeft={X}
                onClick={handleCancelName}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="text-2xl font-bold text-surface-900 truncate">
                {team.name}
              </h1>
              <button
                onClick={() => {
                  setNameValue(team.name);
                  setEditingName(true);
                }}
                className="p-1 rounded-md text-surface-400 hover:text-surface-600 hover:bg-surface-100 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                aria-label="Edit team name"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 mt-2">
            <Badge color={config.color} size="sm">
              <TemplateIcon size={12} />
              {config.label}
            </Badge>
            {team.created_at && (
              <span className="text-sm text-surface-400 flex items-center gap-1">
                <Calendar size={14} />
                Created {formatDate(team.created_at)}
              </span>
            )}
          </div>
        </div>

        {orgRole === 'super_admin' ? (
          <Button
            variant="outline"
            size="sm"
            iconLeft={Trash2}
            onClick={() => setDeleteOpen(true)}
            className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            Delete Team
          </Button>
        ) : (
          <RequestDeletionButton
            label="Request Team Deletion"
            targetType="team"
            targetId={team.id}
            targetName={team.name}
            teamId={team.id}
          />
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 p-1 bg-surface-100 rounded-xl w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700 hover:bg-white/50'
              )}
            >
              <Icon size={16} />
              {tab.label}
              {tab.key === 'members' && (members.length > 0 || invitations.length > 0) && (
                <span
                  className={clsx(
                    'ml-0.5 text-xs px-1.5 py-0.5 rounded-full',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-surface-200 text-surface-600'
                  )}
                >
                  {members.length}
                  {invitations.length > 0 && (
                    <span className="ml-1 text-amber-600">+{invitations.length}</span>
                  )}
                </span>
              )}
              {tab.key === 'roles' && roles.length > 0 && (
                <span
                  className={clsx(
                    'ml-0.5 text-xs px-1.5 py-0.5 rounded-full',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-surface-200 text-surface-600'
                  )}
                >
                  {roles.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab team={team} members={members} roles={roles} onRegenerateJoinToken={onRegenerateJoinToken} />
        )}
        {activeTab === 'members' && (
          <TeamMemberManager
            members={members}
            roles={roles}
            invitations={invitations}
            orgRole={orgRole}
            adminUserIds={adminUserIds}
            onToggleAdmin={onToggleAdmin}
            onAddMember={onAddMember}
            onBulkAddMembers={onBulkAddMembers}
            onRemoveMember={onRemoveMember}
            onUpdateMemberRoles={onUpdateMemberRoles}
            onResendInvitation={onResendInvitation}
            onCancelInvitation={onCancelInvitation}
            onRefresh={onRefresh}
            teamId={team.id}
          />
        )}
        {activeTab === 'roles' && (
          <TeamRoleEditor
            roles={roles}
            onAddRole={onAddRole}
            onEditRole={onEditRole}
            onDeleteRole={onDeleteRole}
            onLoadTemplate={onLoadTemplate}
          />
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setRemoveMembers(false); }}
        title="Delete Team"
        description={`Are you sure you want to delete "${team.name}"? All roles and associated rosters will be permanently removed. This cannot be undone.`}
        width="sm"
      >
        {members.length > 0 && (
          <div className="px-1 py-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={removeMembers}
                onChange={(e) => setRemoveMembers(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-surface-300 text-red-500 focus:ring-red-500 cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-surface-800 group-hover:text-surface-900">
                  Also remove {members.length} member{members.length !== 1 ? 's' : ''} from the organization
                </span>
                <p className="text-xs text-surface-500 mt-0.5">
                  If unchecked, members stay in the org and can be added to other teams.
                </p>
              </div>
            </label>
          </div>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setDeleteOpen(false); setRemoveMembers(false); }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} iconLeft={Trash2}>
            Delete Team{removeMembers ? ' & Members' : ''}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function OverviewTab({ team, members, roles, onRegenerateJoinToken }) {
  const joinUrl = team.join_token
    ? `${window.location.origin}/join/${team.join_token}`
    : null;

  function copyJoinLink() {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl);
    toast.success('Join link copied!');
  }
  const adminCount = members.filter((m) => m.is_admin).length;

  // Group roles by category
  const rolesByCategory = roles.reduce((acc, role) => {
    const cat = role.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(role);
    return acc;
  }, {});

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Quick stats */}
      <div className="lg:col-span-3 grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary-100 p-3">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">
                {members.length}
              </p>
              <p className="text-sm text-surface-500">Team Members</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-emerald-100 p-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">
                {roles.length}
              </p>
              <p className="text-sm text-surface-500">Defined Roles</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-amber-100 p-3">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">
                {adminCount}
              </p>
              <p className="text-sm text-surface-500">Team Admins</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Team info */}
      <div className="lg:col-span-2">
        <Card>
          <Card.Header>
            <Card.Title>Team Information</Card.Title>
          </Card.Header>
          <Card.Body className="space-y-4">
            {team.description && (
              <div>
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                  Description
                </p>
                <p className="text-sm text-surface-700">{team.description}</p>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                  Template Type
                </p>
                <p className="text-sm text-surface-700 capitalize">
                  {team.template_type?.replace('_', ' ') || 'Custom'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                  Created
                </p>
                <p className="text-sm text-surface-700">
                  {team.created_at ? formatDate(team.created_at) : 'Unknown'}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Join link */}
      {joinUrl && (
        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title className="flex items-center gap-2">
                  <Link2 size={16} className="text-primary-500" />
                  Team Join Link
                </Card.Title>
                <button
                  onClick={onRegenerateJoinToken}
                  className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-600 transition-colors cursor-pointer"
                  title="Regenerate link (invalidates old one)"
                >
                  <RefreshCw size={12} />
                  Regenerate
                </button>
              </div>
            </Card.Header>
            <Card.Body>
              <p className="text-xs text-surface-500 mb-3">
                Share this link with anyone you want to join this team. They enter their email and receive a magic link to join automatically.
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={joinUrl}
                  className="flex-1 text-xs bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 text-surface-700 font-mono select-all outline-none"
                  onFocus={(e) => e.target.select()}
                />
                <Button size="sm" iconLeft={Copy} onClick={copyJoinLink}>
                  Copy
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Recent members */}
      <div className="lg:col-span-1">
        <Card>
          <Card.Header>
            <Card.Title>Members</Card.Title>
          </Card.Header>
          <Card.Body>
            {members.length === 0 ? (
              <p className="text-sm text-surface-400 text-center py-4">
                No members yet
              </p>
            ) : (
              <div className="space-y-3">
                {members.slice(0, 6).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar name={member.name} src={member.avatar_url} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-surface-800 truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-surface-400 truncate">
                        {member.roles?.map((r) => r.name).join(', ') || 'No roles'}
                      </p>
                    </div>
                    {member.is_admin && (
                      <Badge color="warning" size="sm">Admin</Badge>
                    )}
                  </div>
                ))}
                {members.length > 6 && (
                  <p className="text-xs text-surface-400 text-center pt-1">
                    +{members.length - 6} more members
                  </p>
                )}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Roles by category */}
      {Object.keys(rolesByCategory).length > 0 && (
        <div className="lg:col-span-3">
          <Card>
            <Card.Header>
              <Card.Title>Roles by Category</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(rolesByCategory).map(([category, catRoles]) => (
                  <div
                    key={category}
                    className="p-3 rounded-lg bg-surface-50 border border-surface-100"
                  >
                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                      {category}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {catRoles.map((role) => (
                        <Badge key={role.id} color="primary" size="sm">
                          {role.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Button that opens a modal for submitting a deletion request to the super admin.
 */
function RequestDeletionButton({ label, targetType, targetId, targetName, teamId }) {
  const { user, profile, orgId } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!supabase || !orgId || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('delete_requests').insert({
        org_id: orgId,
        requested_by: user.id,
        requester_name: profile?.full_name || user.email,
        target_type: targetType,
        target_id: targetId,
        target_name: targetName,
        team_id: teamId || null,
        reason: reason.trim() || null,
      });
      if (error) throw error;
      toast.success('Deletion request sent to super admin');
      setOpen(false);
      setReason('');
    } catch (err) {
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        iconLeft={Send}
        onClick={() => setOpen(true)}
        className="text-orange-500 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
      >
        {label}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Request Deletion"
        description={`Submit a request to your super admin to delete "${targetName}".`}
        width="sm"
      >
        <div className="px-1 pb-2">
          <label className="block text-sm font-medium text-surface-700 mb-1.5">
            Reason (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this should be deleted..."
            rows={3}
            className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 resize-none"
          />
        </div>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            Submit Request
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
