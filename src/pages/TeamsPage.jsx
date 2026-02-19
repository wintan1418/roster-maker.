import { useState, useEffect, useCallback } from 'react';
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
import useAuthStore from '@/stores/authStore';
import useTeamStore from '@/stores/teamStore';
import { TEMPLATE_TYPES } from '@/lib/constants';

// -- Template icon map --------------------------------------------------------

const templateIcons = {
  music: Music,
  church_event: Church,
  custom: Layers,
};

// -- Page component -----------------------------------------------------------

export default function TeamsPage() {
  const navigate = useNavigate();
  const orgId = useAuthStore((s) => s.orgId);
  const { teams, loading, fetchTeams, createTeam, addBulkRoles } = useTeamStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    template_type: '',
  });
  const [errors, setErrors] = useState({});

  // Fetch teams when orgId becomes available
  useEffect(() => {
    if (orgId) {
      fetchTeams(orgId);
    }
  }, [orgId, fetchTeams]);

  // fetchTeams now includes members[] and roles[] already
  const teamsForList = teams;

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

      try {
        // 1. Create the team in Supabase
        const { data: newTeam, error } = await createTeam({
          org_id: orgId,
          name: form.name.trim(),
          description: form.description.trim(),
          template_type: form.template_type,
        });

        if (error || !newTeam) {
          toast.error(error?.message || 'Failed to create team');
          return;
        }

        // 2. Bulk-add default template roles
        const template = TEMPLATE_TYPES[form.template_type];
        const defaultRoles = template?.defaultRoles || [];

        if (defaultRoles.length > 0) {
          const { error: rolesError } = await addBulkRoles(newTeam.id, defaultRoles);
          if (rolesError) {
            console.error('Failed to add default roles:', rolesError.message);
            // Team was created successfully; warn but don't block navigation
            toast.error('Team created but default roles could not be added');
          }
        }

        toast.success(`Team "${newTeam.name}" created successfully`);
        setCreateOpen(false);
        setForm({ name: '', description: '', template_type: '' });
        setErrors({});

        // Navigate to the new team
        navigate(`/teams/${newTeam.id}`);
      } catch (err) {
        console.error('Create team error:', err);
        toast.error('Something went wrong while creating the team');
      } finally {
        setCreating(false);
      }
    },
    [form, orgId, navigate, createTeam, addBulkRoles]
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
        teams={teamsForList}
        loading={loading}
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
