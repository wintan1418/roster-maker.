import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  UserPlus,
  Users,
  MoreHorizontal,
  Trash2,
  Pencil,
  Mail,
  Clock,
  RefreshCw,
  XCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import InviteMemberModal from '@/components/teams/InviteMemberModal';
import BulkAddMembersModal from '@/components/teams/BulkAddMembersModal';

export default function TeamMemberManager({
  members = [],
  roles = [],
  invitations = [],
  onAddMember,
  onBulkAddMembers,
  onRemoveMember,
  onUpdateMemberRoles,
  onResendInvitation,
  onCancelInvitation,
}) {
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [editRolesFor, setEditRolesFor] = useState(null);
  const [editRolesSelected, setEditRolesSelected] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const [invitesExpanded, setInvitesExpanded] = useState(true);
  const [resendingId, setResendingId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const menuButtonRefs = useRef({});

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.roles?.some((r) => r.name?.toLowerCase().includes(q))
    );
  }, [members, search]);

  function handleRemoveMember() {
    if (!removeConfirm) return;
    onRemoveMember?.(removeConfirm.id);
    toast.success(`${removeConfirm.name} removed from team`);
    setRemoveConfirm(null);
    setOpenMenu(null);
  }

  function openEditRoles(member) {
    setEditRolesFor(member);
    setEditRolesSelected(member.roles?.map((r) => r.id) || []);
    setOpenMenu(null);
  }

  function handleSaveRoles() {
    if (!editRolesFor) return;
    onUpdateMemberRoles?.(editRolesFor.id, editRolesSelected);
    toast.success(`Roles updated for ${editRolesFor.name}`);
    setEditRolesFor(null);
  }

  function toggleEditRole(roleId) {
    setEditRolesSelected((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  }

  async function handleResend(invite) {
    setResendingId(invite.id);
    try {
      await onResendInvitation?.(invite.email, invite.full_name);
      toast.success(`Invite resent to ${invite.email}`);
    } catch {
      toast.error('Failed to resend invite');
    } finally {
      setResendingId(null);
    }
  }

  async function handleCancelInvite(invite) {
    try {
      await onCancelInvitation?.(invite.id);
      toast.success(`Invite cancelled for ${invite.email}`);
    } catch {
      toast.error('Failed to cancel invite');
    }
  }

  if (members.length === 0 && invitations.length === 0 && !search) {
    return (
      <>
        <EmptyState
          icon={UserPlus}
          title="No members yet"
          description="Add your first team member individually or paste a list to bulk add."
          action={
            <div className="flex items-center gap-3">
              <Button iconLeft={UserPlus} onClick={() => setInviteOpen(true)}>
                Add Member
              </Button>
              <Button variant="outline" iconLeft={Users} onClick={() => setBulkAddOpen(true)}>
                Bulk Add
              </Button>
            </div>
          }
        />
        <InviteMemberModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          roles={roles}
          onInvite={onAddMember}
        />
        <BulkAddMembersModal
          open={bulkAddOpen}
          onClose={() => setBulkAddOpen(false)}
          roles={roles}
          existingEmails={[]}
          onBulkAdd={onBulkAddMembers}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            iconLeft={Search}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button iconLeft={UserPlus} onClick={() => setInviteOpen(true)}>
            Add Member
          </Button>
          <Button variant="outline" iconLeft={Users} onClick={() => setBulkAddOpen(true)}>
            Bulk Add
          </Button>
        </div>
      </div>

      {/* Members table */}
      {filteredMembers.length === 0 ? (
        <div className="py-12 text-center text-sm text-surface-500">
          No members matching "{search}"
        </div>
      ) : (
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Member</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Roles</Table.HeaderCell>
              <Table.HeaderCell align="right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {filteredMembers.map((member) => (
              <Table.Row key={member.id}>
                {/* Avatar + Name */}
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={member.name}
                      src={member.avatar_url}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-surface-900">
                        {member.name}
                      </p>
                      {member.phone && (
                        <p className="text-xs text-surface-400">{member.phone}</p>
                      )}
                    </div>
                  </div>
                </Table.Cell>

                {/* Email */}
                <Table.Cell>
                  <span className="text-surface-600">{member.email}</span>
                </Table.Cell>

                {/* Roles */}
                <Table.Cell>
                  <div className="flex flex-wrap gap-1">
                    {member.roles?.length > 0 ? (
                      member.roles.map((role) => (
                        <Badge key={role.id} color="primary" size="sm">
                          {role.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-surface-400">No roles</span>
                    )}
                  </div>
                </Table.Cell>

                {/* Actions */}
                <Table.Cell align="right">
                  <div className="inline-block">
                    <Button
                      ref={(el) => { menuButtonRefs.current[member.id] = el; }}
                      variant="ghost"
                      size="sm"
                      iconLeft={MoreHorizontal}
                      onClick={() => {
                        if (openMenu === member.id) {
                          setOpenMenu(null);
                        } else {
                          const btn = menuButtonRefs.current[member.id];
                          if (btn) {
                            const rect = btn.getBoundingClientRect();
                            setMenuPos({
                              top: rect.bottom + 4,
                              right: window.innerWidth - rect.right,
                            });
                          }
                          setOpenMenu(member.id);
                        }
                      }}
                      aria-label="Member actions"
                    />

                    {openMenu === member.id && createPortal(
                      <>
                        {/* Backdrop to close menu */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setOpenMenu(null)}
                        />
                        <div
                          className="fixed z-50 w-48 bg-white rounded-lg border border-surface-200 shadow-lg py-1"
                          style={{ top: menuPos.top, right: menuPos.right }}
                        >
                          <button
                            onClick={() => openEditRoles(member)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors cursor-pointer"
                          >
                            <Pencil size={14} className="text-surface-400" />
                            Edit Roles
                          </button>
                          <div className="border-t border-surface-100 my-1" />
                          <button
                            onClick={() => {
                              setRemoveConfirm(member);
                              setOpenMenu(null);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                            Remove Member
                          </button>
                        </div>
                      </>,
                      document.body
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {/* Member count */}
      <p className="text-xs text-surface-400">
        {filteredMembers.length} of {members.length} member{members.length !== 1 ? 's' : ''}
      </p>

      {/* Pending Invites section */}
      {invitations.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
          {/* Header */}
          <button
            type="button"
            onClick={() => setInvitesExpanded((v) => !v)}
            className="flex items-center justify-between w-full px-4 py-3 text-left cursor-pointer hover:bg-amber-100/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">
                Pending Invites
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-700 font-semibold">
                {invitations.length}
              </span>
            </div>
            {invitesExpanded ? (
              <ChevronDown size={15} className="text-amber-600" />
            ) : (
              <ChevronRight size={15} className="text-amber-600" />
            )}
          </button>

          {/* Invite list */}
          {invitesExpanded && (
            <div className="divide-y divide-amber-100 border-t border-amber-200">
              {invitations.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center gap-3 px-4 py-3 bg-white/70"
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100 text-amber-500 shrink-0">
                    <Mail size={15} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">
                      {invite.full_name || invite.email}
                    </p>
                    <p className="text-xs text-surface-500 truncate">{invite.email}</p>
                    {invite.created_at && (
                      <p className="text-xs text-surface-400 mt-0.5">
                        Invited {formatDate(invite.created_at)}
                      </p>
                    )}
                  </div>

                  {/* Badge + actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge color="warning" size="sm">
                      Pending
                    </Badge>
                    <button
                      type="button"
                      title="Resend invite"
                      onClick={() => handleResend(invite)}
                      disabled={resendingId === invite.id}
                      className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw size={14} className={resendingId === invite.id ? 'animate-spin' : ''} />
                    </button>
                    <button
                      type="button"
                      title="Cancel invite"
                      onClick={() => handleCancelInvite(invite)}
                      className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        roles={roles}
        onInvite={onAddMember}
      />

      {/* Bulk Add Modal */}
      <BulkAddMembersModal
        open={bulkAddOpen}
        onClose={() => setBulkAddOpen(false)}
        roles={roles}
        existingEmails={members.map((m) => m.email)}
        onBulkAdd={onBulkAddMembers}
      />

      {/* Remove Confirmation Modal */}
      <Modal
        open={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        title="Remove Member"
        description={`Are you sure you want to remove ${removeConfirm?.name} from this team? This action cannot be undone.`}
        width="sm"
      >
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRemoveConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRemoveMember} iconLeft={Trash2}>
            Remove
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Roles Modal */}
      <Modal
        open={!!editRolesFor}
        onClose={() => setEditRolesFor(null)}
        title={`Edit Roles for ${editRolesFor?.name || ''}`}
        description="Select the roles this member can fill."
        width="sm"
      >
        <div className="max-h-64 overflow-y-auto">
          {(() => {
            // Group roles by category
            const grouped = {};
            for (const role of roles) {
              const cat = role.category || 'other';
              if (!grouped[cat]) grouped[cat] = [];
              grouped[cat].push(role);
            }
            return Object.entries(grouped).map(([category, catRoles]) => (
              <div key={category} className="mb-2">
                <p className="px-2 py-1 text-[10px] font-semibold text-surface-400 uppercase tracking-wider bg-surface-50 sticky top-0">
                  {category}
                </p>
                {catRoles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-surface-50 cursor-pointer transition-colors duration-150"
                  >
                    <input
                      type="checkbox"
                      checked={editRolesSelected.includes(role.id)}
                      onChange={() => toggleEditRole(role.id)}
                      className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="text-sm text-surface-700">{role.name}</span>
                  </label>
                ))}
              </div>
            ));
          })()}
        </div>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditRolesFor(null)}>
            Cancel
          </Button>
          <Button onClick={handleSaveRoles}>Save Roles</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
