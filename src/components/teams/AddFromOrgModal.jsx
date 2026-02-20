import { useState, useEffect, useMemo } from 'react';
import { Search, UserPlus, Check, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import useAuthStore from '@/stores/authStore';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';

/**
 * Modal to add existing organization members to the current team.
 * Fetches all org members, filters out those already in the team,
 * lets admin pick multiple, and adds them in one go.
 */
export default function AddFromOrgModal({
    open,
    onClose,
    teamId,
    existingUserIds = [],
    roles = [],
    onAddMembers,
}) {
    const { orgId } = useAuthStore();
    const [orgMembers, setOrgMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [selected, setSelected] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedRoles, setSelectedRoles] = useState([]);

    // Fetch org members when modal opens
    useEffect(() => {
        if (!open || !supabase || !orgId) return;

        async function fetchOrgMembers() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('org_members')
                    .select(`
            user_id,
            role,
            profile:profiles (id, full_name, email, phone, avatar_url)
          `)
                    .eq('organization_id', orgId);

                if (error) throw error;

                const members = (data || [])
                    .filter((om) => om.profile)
                    .map((om) => ({
                        user_id: om.user_id,
                        name: om.profile.full_name,
                        email: om.profile.email,
                        phone: om.profile.phone,
                        avatar_url: om.profile.avatar_url,
                        orgRole: om.role,
                    }));

                setOrgMembers(members);
            } catch (err) {
                console.error('Failed to fetch org members:', err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchOrgMembers();
        setSelected([]);
        setSearch('');
        setSelectedRoles([]);
    }, [open, orgId]);

    // Members not already in this team
    const available = useMemo(() => {
        const existingSet = new Set(existingUserIds);
        return orgMembers.filter((m) => !existingSet.has(m.user_id));
    }, [orgMembers, existingUserIds]);

    // Filtered by search
    const filtered = useMemo(() => {
        if (!search.trim()) return available;
        const q = search.toLowerCase();
        return available.filter(
            (m) =>
                m.name?.toLowerCase().includes(q) ||
                m.email?.toLowerCase().includes(q)
        );
    }, [available, search]);

    function toggleSelect(userId) {
        setSelected((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    }

    function selectAll() {
        if (selected.length === filtered.length) {
            setSelected([]);
        } else {
            setSelected(filtered.map((m) => m.user_id));
        }
    }

    async function handleAdd() {
        if (selected.length === 0) {
            toast.error('Select at least one member');
            return;
        }

        setAdding(true);
        try {
            // Build team_members records
            const teamMemberInserts = selected.map((userId) => ({
                team_id: teamId,
                user_id: userId,
                is_team_admin: false,
            }));

            const { data: inserted, error: tmError } = await supabase
                .from('team_members')
                .upsert(teamMemberInserts, { onConflict: 'team_id,user_id', ignoreDuplicates: true })
                .select('id, user_id');

            if (tmError) throw tmError;

            // If roles are selected, assign them to the new members
            if (selectedRoles.length > 0 && inserted && inserted.length > 0) {
                const roleInserts = [];
                for (const tm of inserted) {
                    for (const roleId of selectedRoles) {
                        roleInserts.push({
                            team_member_id: tm.id,
                            team_role_id: roleId,
                        });
                    }
                }
                if (roleInserts.length > 0) {
                    await supabase
                        .from('member_roles')
                        .upsert(roleInserts, { onConflict: 'team_member_id,team_role_id', ignoreDuplicates: true });
                }
            }

            const names = selected
                .map((id) => orgMembers.find((m) => m.user_id === id)?.name)
                .filter(Boolean);

            toast.success(
                selected.length === 1
                    ? `${names[0]} added to team!`
                    : `${selected.length} members added to team!`
            );

            onAddMembers?.();
            onClose();
        } catch (err) {
            toast.error(err.message || 'Failed to add members');
        } finally {
            setAdding(false);
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Add from Organization"
            description="Select existing organization members to add to this team."
            width="md"
        >
            <div className="space-y-3">
                {/* Search */}
                <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    iconLeft={Search}
                    autoFocus
                />

                {/* Select all / count */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={selectAll}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 cursor-pointer"
                    >
                        {selected.length === filtered.length && filtered.length > 0
                            ? 'Deselect all'
                            : 'Select all'}
                    </button>
                    <span className="text-xs text-surface-400">
                        {available.length} available • {selected.length} selected
                    </span>
                </div>

                {/* Member list */}
                <div className="max-h-64 overflow-y-auto border border-surface-200 rounded-xl divide-y divide-surface-100">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {!loading && filtered.length === 0 && (
                        <div className="py-8 text-center">
                            <Users size={24} className="text-surface-300 mx-auto mb-2" />
                            <p className="text-sm text-surface-500">
                                {available.length === 0
                                    ? 'All org members are already in this team'
                                    : 'No members match your search'}
                            </p>
                        </div>
                    )}

                    {!loading &&
                        filtered.map((m) => {
                            const isSelected = selected.includes(m.user_id);
                            return (
                                <button
                                    key={m.user_id}
                                    onClick={() => toggleSelect(m.user_id)}
                                    className={`flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors cursor-pointer ${isSelected
                                            ? 'bg-primary-50'
                                            : 'hover:bg-surface-50'
                                        }`}
                                >
                                    {/* Checkbox */}
                                    <div
                                        className={`flex items-center justify-center w-5 h-5 rounded border-2 shrink-0 transition-colors ${isSelected
                                                ? 'bg-primary-600 border-primary-600'
                                                : 'border-surface-300'
                                            }`}
                                    >
                                        {isSelected && <Check size={12} className="text-white" />}
                                    </div>

                                    <Avatar name={m.name} src={m.avatar_url} size="sm" />

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-surface-800 truncate">
                                            {m.name}
                                        </p>
                                        <p className="text-xs text-surface-400 truncate">{m.email}</p>
                                    </div>

                                    <Badge color="default" size="sm">
                                        {m.orgRole === 'super_admin'
                                            ? 'Super Admin'
                                            : m.orgRole === 'team_admin'
                                                ? 'Admin'
                                                : 'Member'}
                                    </Badge>
                                </button>
                            );
                        })}
                </div>

                {/* Role assignment (optional) */}
                {roles.length > 0 && selected.length > 0 && (
                    <div>
                        <p className="text-xs font-medium text-surface-500 mb-2">
                            Assign roles (optional)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {roles.map((role) => {
                                const isRoleSelected = selectedRoles.includes(role.id);
                                return (
                                    <button
                                        key={role.id}
                                        onClick={() =>
                                            setSelectedRoles((prev) =>
                                                isRoleSelected
                                                    ? prev.filter((id) => id !== role.id)
                                                    : [...prev, role.id]
                                            )
                                        }
                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${isRoleSelected
                                                ? 'bg-primary-50 border-primary-300 text-primary-700'
                                                : 'border-surface-200 text-surface-500 hover:border-surface-300'
                                            }`}
                                    >
                                        {role.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    onClick={handleAdd}
                    loading={adding}
                    disabled={selected.length === 0}
                    iconLeft={UserPlus}
                >
                    Add {selected.length > 0 ? `(${selected.length})` : ''}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
