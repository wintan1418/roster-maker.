import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/LoadingSpinner';
import TeamDetail from '@/components/teams/TeamDetail';
import { MUSIC_ROLES, CHURCH_EVENT_ROLES } from '@/lib/constants';

// ── Demo data (duplicated here so this page works standalone) ────────────────

const DEMO_MEMBERS = [
  { id: 'm1', name: 'Sarah Johnson', email: 'sarah.j@gracechurch.org', phone: '(555) 123-4567', is_admin: true },
  { id: 'm2', name: 'David Kim', email: 'david.k@gracechurch.org', phone: '(555) 234-5678', is_admin: false },
  { id: 'm3', name: 'Rachel Thompson', email: 'rachel.t@gracechurch.org', phone: '(555) 345-6789', is_admin: false },
  { id: 'm4', name: 'Michael Chen', email: 'michael.c@gracechurch.org', phone: '', is_admin: false },
  { id: 'm5', name: 'Emily Davis', email: 'emily.d@gracechurch.org', phone: '(555) 456-7890', is_admin: true },
  { id: 'm6', name: 'James Wilson', email: 'james.w@gracechurch.org', phone: '(555) 567-8901', is_admin: false },
  { id: 'm7', name: 'Grace Lee', email: 'grace.l@gracechurch.org', phone: '(555) 678-9012', is_admin: false },
  { id: 'm8', name: 'Daniel Brown', email: 'daniel.b@gracechurch.org', phone: '', is_admin: false },
  { id: 'm9', name: 'Hannah Martinez', email: 'hannah.m@gracechurch.org', phone: '(555) 789-0123', is_admin: false },
  { id: 'm10', name: 'Andrew Taylor', email: 'andrew.t@gracechurch.org', phone: '(555) 890-1234', is_admin: false },
];

const musicRoles = MUSIC_ROLES.map((r, i) => ({ id: `mr${i + 1}`, ...r }));
const eventRoles = CHURCH_EVENT_ROLES.map((r, i) => ({ id: `er${i + 1}`, ...r }));

function buildMembers(memberIds, roles) {
  return memberIds.map((id) => {
    const member = DEMO_MEMBERS.find((m) => m.id === id);
    if (!member) return null;
    const numRoles = 1 + Math.floor(Math.abs(hashStr(id + 'seed')) % 2);
    const shuffled = [...roles].sort(
      (a, b) => hashStr(a.id + id) - hashStr(b.id + id)
    );
    return { ...member, roles: shuffled.slice(0, numRoles) };
  }).filter(Boolean);
}

// Deterministic hash for consistent role assignment
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (s.charCodeAt(i) + ((h << 5) - h)) | 0;
  return h;
}

const DEMO_TEAMS = {
  'team-1': {
    id: 'team-1',
    name: 'Music Ministry',
    description: 'Sunday morning worship team. Includes vocalists, instrumentalists, and technical crew for our weekly services.',
    template_type: 'music',
    created_at: '2025-09-15T10:00:00Z',
    memberIds: ['m1', 'm2', 'm3', 'm4', 'm6', 'm7'],
    initialRoles: musicRoles,
  },
  'team-2': {
    id: 'team-2',
    name: 'Ushers & Greeters',
    description: 'Hospitality team responsible for welcoming, seating, and assisting during services and events.',
    template_type: 'church_event',
    created_at: '2025-10-02T14:30:00Z',
    memberIds: ['m5', 'm8', 'm9', 'm10'],
    initialRoles: eventRoles,
  },
  'team-3': {
    id: 'team-3',
    name: 'Prayer Team',
    description: 'Dedicated intercessors who pray during services and are available for prayer ministry after each gathering.',
    template_type: 'custom',
    created_at: '2025-11-20T09:00:00Z',
    memberIds: ['m1', 'm3', 'm5', 'm7', 'm9'],
    initialRoles: [
      { id: 'pr1', name: 'Prayer Leader', category: 'leadership', min_required: 1, max_allowed: 2 },
      { id: 'pr2', name: 'Intercessor', category: 'ministry', min_required: 2, max_allowed: 6 },
      { id: 'pr3', name: 'Altar Worker', category: 'ministry', min_required: 1, max_allowed: 4 },
    ],
  },
  'team-4': {
    id: 'team-4',
    name: 'Youth Ministry',
    description: 'Youth service team for Friday night gatherings, camps, and outreach events for ages 13-18.',
    template_type: 'church_event',
    created_at: '2026-01-08T16:00:00Z',
    memberIds: ['m2', 'm4', 'm6', 'm8', 'm10'],
    initialRoles: eventRoles.slice(0, 6),
  },
};

// ── Page component ───────────────────────────────────────────────────────────

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const demoTeam = DEMO_TEAMS[teamId];

  // Local state to make the demo interactive
  const [team, setTeam] = useState(() => {
    if (!demoTeam) return null;
    return {
      id: demoTeam.id,
      name: demoTeam.name,
      description: demoTeam.description,
      template_type: demoTeam.template_type,
      created_at: demoTeam.created_at,
    };
  });

  const [roles, setRoles] = useState(() => demoTeam?.initialRoles || []);

  const [members, setMembers] = useState(() => {
    if (!demoTeam) return [];
    return buildMembers(demoTeam.memberIds, demoTeam.initialRoles);
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleUpdateTeam = useCallback((updates) => {
    setTeam((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const handleDeleteTeam = useCallback(() => {
    toast.success('Team deleted');
    navigate('/teams');
  }, [navigate]);

  const handleAddMember = useCallback(
    async (data) => {
      await new Promise((r) => setTimeout(r, 400));
      const newMember = {
        id: `m-new-${Date.now()}`,
        name: data.name || data.email.split('@')[0],
        email: data.email,
        phone: data.phone || '',
        is_admin: false,
        roles: roles.filter((r) => data.roles?.includes(r.id)),
      };
      setMembers((prev) => [...prev, newMember]);
    },
    [roles]
  );

  const handleRemoveMember = useCallback((memberId) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }, []);

  const handleToggleAdmin = useCallback((memberId, isAdmin) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, is_admin: isAdmin } : m))
    );
  }, []);

  const handleUpdateMemberRoles = useCallback(
    (memberId, roleIds) => {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? { ...m, roles: roles.filter((r) => roleIds.includes(r.id)) }
            : m
        )
      );
    },
    [roles]
  );

  const handleAddRole = useCallback((roleData) => {
    const newRole = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...roleData,
    };
    setRoles((prev) => [...prev, newRole]);
  }, []);

  const handleEditRole = useCallback((roleId, updates) => {
    setRoles((prev) =>
      prev.map((r) => (r.id === roleId ? { ...r, ...updates } : r))
    );
  }, []);

  const handleDeleteRole = useCallback((roleId) => {
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    // Remove deleted role from members
    setMembers((prev) =>
      prev.map((m) => ({
        ...m,
        roles: m.roles?.filter((r) => r.id !== roleId) || [],
      }))
    );
  }, []);

  const handleLoadTemplate = useCallback((templateRoles) => {
    const newRoles = templateRoles.map((r, i) => ({
      id: `tmpl-${Date.now()}-${i}`,
      ...r,
    }));
    setRoles((prev) => [...prev, ...newRoles]);
  }, []);

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
