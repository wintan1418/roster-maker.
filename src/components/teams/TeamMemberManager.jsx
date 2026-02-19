import { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  MoreHorizontal,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import InviteMemberModal from '@/components/teams/InviteMemberModal';

export default function TeamMemberManager({
  members = [],
  roles = [],
  onAddMember,
  onRemoveMember,
  onToggleAdmin,
  onUpdateMemberRoles,
}) {
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [editRolesFor, setEditRolesFor] = useState(null);
  const [editRolesSelected, setEditRolesSelected] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);

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

  function handleToggleAdmin(member) {
    const newStatus = !member.is_admin;
    onToggleAdmin?.(member.id, newStatus);
    toast.success(
      newStatus
        ? `${member.name} is now a team admin`
        : `${member.name} is no longer an admin`
    );
    setOpenMenu(null);
  }

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

  if (members.length === 0 && !search) {
    return (
      <>
        <EmptyState
          icon={UserPlus}
          title="No members yet"
          description="Invite your first team member to get started."
          action={
            <Button iconLeft={UserPlus} onClick={() => setInviteOpen(true)}>
              Invite Member
            </Button>
          }
        />
        <InviteMemberModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          roles={roles}
          onInvite={onAddMember}
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
        <Button iconLeft={UserPlus} onClick={() => setInviteOpen(true)}>
          Add Member
        </Button>
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
              <Table.HeaderCell>Status</Table.HeaderCell>
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

                {/* Admin status */}
                <Table.Cell>
                  {member.is_admin ? (
                    <Badge color="warning" size="sm" dot>
                      Admin
                    </Badge>
                  ) : (
                    <Badge color="default" size="sm">
                      Member
                    </Badge>
                  )}
                </Table.Cell>

                {/* Actions */}
                <Table.Cell align="right">
                  <div className="relative inline-block">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft={MoreHorizontal}
                      onClick={() =>
                        setOpenMenu(openMenu === member.id ? null : member.id)
                      }
                      aria-label="Member actions"
                    />

                    {openMenu === member.id && (
                      <>
                        {/* Backdrop to close menu */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenu(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-lg border border-surface-200 shadow-lg py-1 animate-in fade-in zoom-in-95">
                          <button
                            onClick={() => openEditRoles(member)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors cursor-pointer"
                          >
                            <Pencil size={14} className="text-surface-400" />
                            Edit Roles
                          </button>
                          <button
                            onClick={() => handleToggleAdmin(member)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors cursor-pointer"
                          >
                            {member.is_admin ? (
                              <>
                                <ShieldOff size={14} className="text-surface-400" />
                                Remove Admin
                              </>
                            ) : (
                              <>
                                <ShieldCheck size={14} className="text-surface-400" />
                                Make Admin
                              </>
                            )}
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
                      </>
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

      {/* Invite Modal */}
      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        roles={roles}
        onInvite={onAddMember}
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
        description="Select the roles this member should have."
        width="sm"
      >
        <div className="max-h-64 overflow-y-auto space-y-1">
          {roles.map((role) => (
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
              <div>
                <span className="text-sm text-surface-700">{role.name}</span>
                {role.category && (
                  <span className="ml-2 text-xs text-surface-400 capitalize">
                    {role.category}
                  </span>
                )}
              </div>
            </label>
          ))}
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
