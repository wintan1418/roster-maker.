import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Users,
  Music,
  Church,
  Layers,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import TeamList from '@/components/teams/TeamList';
import { TEMPLATE_TYPES, MUSIC_ROLES, CHURCH_EVENT_ROLES } from '@/lib/constants';

// ── Demo data ────────────────────────────────────────────────────────────────

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

function assignRoles(memberIds, roles) {
  return memberIds.map((id) => {
    const member = DEMO_MEMBERS.find((m) => m.id === id);
    const numRoles = 1 + Math.floor(Math.random() * 2);
    const shuffled = [...roles].sort(() => 0.5 - Math.random());
    return {
      ...member,
      roles: shuffled.slice(0, numRoles),
    };
  });
}

const INITIAL_TEAMS = [
  {
    id: 'team-1',
    name: 'Music Ministry',
    description: 'Sunday morning worship team. Includes vocalists, instrumentalists, and technical crew for our weekly services.',
    template_type: 'music',
    created_at: '2025-09-15T10:00:00Z',
    members: assignRoles(['m1', 'm2', 'm3', 'm4', 'm6', 'm7'], musicRoles),
    roles: musicRoles,
  },
  {
    id: 'team-2',
    name: 'Ushers & Greeters',
    description: 'Hospitality team responsible for welcoming, seating, and assisting during services and events.',
    template_type: 'church_event',
    created_at: '2025-10-02T14:30:00Z',
    members: assignRoles(['m5', 'm8', 'm9', 'm10'], eventRoles),
    roles: eventRoles,
  },
  {
    id: 'team-3',
    name: 'Prayer Team',
    description: 'Dedicated intercessors who pray during services and are available for prayer ministry after each gathering.',
    template_type: 'custom',
    created_at: '2025-11-20T09:00:00Z',
    members: assignRoles(['m1', 'm3', 'm5', 'm7', 'm9'], [
      { id: 'pr1', name: 'Prayer Leader', category: 'leadership', min_required: 1, max_allowed: 2 },
      { id: 'pr2', name: 'Intercessor', category: 'ministry', min_required: 2, max_allowed: 6 },
      { id: 'pr3', name: 'Altar Worker', category: 'ministry', min_required: 1, max_allowed: 4 },
    ]),
    roles: [
      { id: 'pr1', name: 'Prayer Leader', category: 'leadership', min_required: 1, max_allowed: 2 },
      { id: 'pr2', name: 'Intercessor', category: 'ministry', min_required: 2, max_allowed: 6 },
      { id: 'pr3', name: 'Altar Worker', category: 'ministry', min_required: 1, max_allowed: 4 },
    ],
  },
  {
    id: 'team-4',
    name: 'Youth Ministry',
    description: 'Youth service team for Friday night gatherings, camps, and outreach events for ages 13-18.',
    template_type: 'church_event',
    created_at: '2026-01-08T16:00:00Z',
    members: assignRoles(['m2', 'm4', 'm6', 'm8', 'm10'], eventRoles.slice(0, 6)),
    roles: eventRoles.slice(0, 6),
  },
];

// ── Template icon map ────────────────────────────────────────────────────────

const templateIcons = {
  music: Music,
  church_event: Church,
  custom: Layers,
};

// ── Page component ───────────────────────────────────────────────────────────

export default function TeamsPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    template_type: '',
  });
  const [errors, setErrors] = useState({});

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Team name is required';
    if (!form.template_type) newErrors.template_type = 'Please select a template';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleCreate = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!validate()) return;

      setCreating(true);

      // Simulate async operation
      await new Promise((r) => setTimeout(r, 600));

      const template = TEMPLATE_TYPES[form.template_type];
      const defaultRoles = (template?.defaultRoles || []).map((role, i) => ({
        id: `new-r-${Date.now()}-${i}`,
        ...role,
      }));

      const newTeam = {
        id: `team-${Date.now()}`,
        name: form.name.trim(),
        description: form.description.trim(),
        template_type: form.template_type,
        created_at: new Date().toISOString(),
        members: [],
        roles: defaultRoles,
      };

      setTeams((prev) => [...prev, newTeam]);
      toast.success(`Team "${newTeam.name}" created successfully`);
      setCreateOpen(false);
      setForm({ name: '', description: '', template_type: '' });
      setErrors({});
      setCreating(false);

      // Navigate to the new team
      navigate(`/teams/${newTeam.id}`);
    },
    [form, navigate]
  );

  function handleCloseCreate() {
    setCreateOpen(false);
    setForm({ name: '', description: '', template_type: '' });
    setErrors({});
  }

  const selectedTemplate = form.template_type
    ? TEMPLATE_TYPES[form.template_type]
    : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Teams</h1>
          <p className="text-sm text-surface-500 mt-1">
            Manage your teams, members, and role configurations.
          </p>
        </div>
        <Button iconLeft={Plus} onClick={() => setCreateOpen(true)}>
          Create Team
        </Button>
      </div>

      {/* Team grid */}
      <TeamList
        teams={teams}
        onCreateTeam={() => setCreateOpen(true)}
      />

      {/* Create Team Modal */}
      <Modal
        open={createOpen}
        onClose={handleCloseCreate}
        title="Create a New Team"
        description="Set up a team with a name, description, and template to get started quickly."
        width="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Team name"
            name="name"
            placeholder="e.g., Sunday Worship Team"
            value={form.name}
            onChange={handleFormChange}
            error={errors.name}
            iconLeft={Users}
          />

          <Input
            label="Description (optional)"
            name="description"
            placeholder="What is this team for?"
            value={form.description}
            onChange={handleFormChange}
          />

          <Select
            label="Template type"
            name="template_type"
            value={form.template_type}
            onChange={handleFormChange}
            error={errors.template_type}
            placeholder="Choose a template..."
          >
            {Object.entries(TEMPLATE_TYPES).map(([key, tmpl]) => (
              <option key={key} value={key}>
                {tmpl.label}
              </option>
            ))}
          </Select>

          {/* Template description + role preview */}
          {selectedTemplate && (
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                {(() => {
                  const TIcon = templateIcons[form.template_type] || Layers;
                  return (
                    <div className="rounded-lg bg-primary-100 p-2 shrink-0">
                      <TIcon size={18} className="text-primary-600" />
                    </div>
                  );
                })()}
                <div>
                  <p className="text-sm font-medium text-surface-800">
                    {selectedTemplate.label}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {selectedTemplate.description}
                  </p>
                </div>
              </div>

              {selectedTemplate.defaultRoles.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-amber-500" />
                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Default Roles ({selectedTemplate.defaultRoles.length})
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTemplate.defaultRoles.map((role) => (
                      <Badge key={role.name} color="primary" size="sm">
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedTemplate.defaultRoles.length === 0 && (
                <p className="text-xs text-surface-400 italic">
                  No default roles. You can add custom roles after creating the team.
                </p>
              )}
            </div>
          )}
        </form>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseCreate}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            loading={creating}
            iconLeft={creating ? undefined : Plus}
          >
            Create Team
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

// Export demo data for use in TeamDetailPage
export { INITIAL_TEAMS, DEMO_MEMBERS };
