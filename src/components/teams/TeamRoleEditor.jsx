import { useState } from 'react';
import clsx from 'clsx';
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { TEMPLATE_TYPES } from '@/lib/constants';

const CATEGORIES = [
  'leadership',
  'vocals',
  'instruments',
  'tech',
  'hospitality',
  'ministry',
  'logistics',
  'general',
];

const categoryColors = {
  leadership: 'warning',
  vocals: 'primary',
  instruments: 'info',
  tech: 'success',
  hospitality: 'error',
  ministry: 'primary',
  logistics: 'default',
  general: 'default',
};

function RoleRow({ role, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: role.name,
    category: role.category || 'general',
    min_required: role.min_required ?? 0,
    max_allowed: role.max_allowed ?? 1,
  });

  function handleSave() {
    if (!form.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    onEdit?.(role.id, {
      ...form,
      name: form.name.trim(),
      min_required: parseInt(form.min_required, 10) || 0,
      max_allowed: parseInt(form.max_allowed, 10) || 1,
    });
    setEditing(false);
    toast.success(`Role "${form.name.trim()}" updated`);
  }

  function handleCancel() {
    setForm({
      name: role.name,
      category: role.category || 'general',
      min_required: role.min_required ?? 0,
      max_allowed: role.max_allowed ?? 1,
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-start gap-2 p-3 bg-primary-50/50 border border-primary-100 rounded-lg">
        <div className="pt-2.5 text-surface-300">
          <GripVertical size={16} />
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Role name"
            className="sm:col-span-1"
          />
          <Select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </Select>
          <Input
            type="number"
            min="0"
            value={form.min_required}
            onChange={(e) => setForm((f) => ({ ...f, min_required: e.target.value }))}
            placeholder="Min"
          />
          <Input
            type="number"
            min="0"
            value={form.max_allowed}
            onChange={(e) => setForm((f) => ({ ...f, max_allowed: e.target.value }))}
            placeholder="Max"
          />
        </div>
        <div className="flex items-center gap-1 pt-1.5">
          <Button variant="ghost" size="sm" iconLeft={Check} onClick={handleSave} />
          <Button variant="ghost" size="sm" iconLeft={X} onClick={handleCancel} />
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-surface-50 transition-colors duration-150">
      <div className="text-surface-300 cursor-grab active:cursor-grabbing">
        <GripVertical size={16} />
      </div>
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <span className="font-medium text-sm text-surface-800 truncate">
          {role.name}
        </span>
        <Badge color={categoryColors[role.category] || 'default'} size="sm">
          {role.category || 'general'}
        </Badge>
      </div>
      <div className="flex items-center gap-4 text-xs text-surface-500">
        <span title="Minimum required">
          Min: <span className="font-medium text-surface-700">{role.min_required ?? 0}</span>
        </span>
        <span title="Maximum allowed">
          Max: <span className="font-medium text-surface-700">{role.max_allowed ?? 1}</span>
        </span>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <Button
          variant="ghost"
          size="sm"
          iconLeft={Pencil}
          onClick={() => setEditing(true)}
          aria-label="Edit role"
        />
        <Button
          variant="ghost"
          size="sm"
          iconLeft={Trash2}
          onClick={() => onDelete?.(role)}
          aria-label="Delete role"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        />
      </div>
    </div>
  );
}

export default function TeamRoleEditor({ roles = [], onAddRole, onEditRole, onDeleteRole, onLoadTemplate }) {
  const [addingRole, setAddingRole] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    category: 'general',
    min_required: 0,
    max_allowed: 1,
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [templateOpen, setTemplateOpen] = useState(false);

  function handleAddRole() {
    if (!newRole.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    onAddRole?.({
      ...newRole,
      name: newRole.name.trim(),
      min_required: parseInt(newRole.min_required, 10) || 0,
      max_allowed: parseInt(newRole.max_allowed, 10) || 1,
    });
    toast.success(`Role "${newRole.name.trim()}" added`);
    setNewRole({ name: '', category: 'general', min_required: 0, max_allowed: 1 });
    setAddingRole(false);
  }

  function handleDeleteRole() {
    if (!deleteConfirm) return;
    onDeleteRole?.(deleteConfirm.id);
    toast.success(`Role "${deleteConfirm.name}" deleted`);
    setDeleteConfirm(null);
  }

  function handleLoadTemplate(templateKey) {
    const template = TEMPLATE_TYPES[templateKey];
    if (!template) return;
    onLoadTemplate?.(template.defaultRoles);
    toast.success(`Loaded ${template.label} template with ${template.defaultRoles.length} roles`);
    setTemplateOpen(false);
  }

  // Group roles by category for display
  const rolesByCategory = roles.reduce((acc, role) => {
    const cat = role.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(role);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          iconLeft={Sparkles}
          onClick={() => setTemplateOpen(true)}
        >
          Load from Template
        </Button>
        <div className="flex-1" />
        <span className="text-sm text-surface-500">
          {roles.length} role{roles.length !== 1 ? 's' : ''} defined
        </span>
      </div>

      {/* Role list */}
      {roles.length === 0 && !addingRole ? (
        <EmptyState
          icon={ShieldCheck}
          title="No roles defined"
          description="Define roles for this team or load from a template to get started quickly."
          action={
            <div className="flex gap-2">
              <Button
                variant="outline"
                iconLeft={Sparkles}
                onClick={() => setTemplateOpen(true)}
              >
                Load Template
              </Button>
              <Button iconLeft={Plus} onClick={() => setAddingRole(true)}>
                Add Role
              </Button>
            </div>
          }
        />
      ) : (
        <div className="rounded-xl border border-surface-200 divide-y divide-surface-100 bg-white">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-50 rounded-t-xl">
            <div className="w-4" />
            <span className="flex-1 text-xs font-semibold text-surface-500 uppercase tracking-wider">
              Role Name
            </span>
            <span className="w-24 text-xs font-semibold text-surface-500 uppercase tracking-wider text-center">
              Min
            </span>
            <span className="w-24 text-xs font-semibold text-surface-500 uppercase tracking-wider text-center">
              Max
            </span>
            <div className="w-20" />
          </div>

          {/* Roles */}
          {roles.map((role) => (
            <RoleRow
              key={role.id}
              role={role}
              onEdit={onEditRole}
              onDelete={setDeleteConfirm}
            />
          ))}

          {/* Inline add form */}
          {addingRole && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50/50 border-t border-emerald-100">
              <div className="pt-2.5 text-surface-300">
                <Plus size={16} />
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <Input
                  value={newRole.name}
                  onChange={(e) =>
                    setNewRole((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Role name"
                  autoFocus
                />
                <Select
                  value={newRole.category}
                  onChange={(e) =>
                    setNewRole((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min="0"
                  value={newRole.min_required}
                  onChange={(e) =>
                    setNewRole((f) => ({ ...f, min_required: e.target.value }))
                  }
                  placeholder="Min"
                />
                <Input
                  type="number"
                  min="0"
                  value={newRole.max_allowed}
                  onChange={(e) =>
                    setNewRole((f) => ({ ...f, max_allowed: e.target.value }))
                  }
                  placeholder="Max"
                />
              </div>
              <div className="flex items-center gap-1 pt-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={Check}
                  onClick={handleAddRole}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={X}
                  onClick={() => {
                    setAddingRole(false);
                    setNewRole({
                      name: '',
                      category: 'general',
                      min_required: 0,
                      max_allowed: 1,
                    });
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add role button (when list already has items) */}
      {(roles.length > 0 || addingRole) && !addingRole && (
        <Button
          variant="outline"
          size="sm"
          iconLeft={Plus}
          onClick={() => setAddingRole(true)}
        >
          Add Role
        </Button>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Role"
        description={`Are you sure you want to delete "${deleteConfirm?.name}"? Members assigned to this role will be unassigned.`}
        width="sm"
      >
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteRole} iconLeft={Trash2}>
            Delete Role
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Template picker modal */}
      <Modal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title="Load Roles from Template"
        description="Choose a template to pre-fill roles. This will add template roles to the existing list."
        width="lg"
      >
        <div className="grid gap-3">
          {Object.entries(TEMPLATE_TYPES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => handleLoadTemplate(key)}
              className={clsx(
                'text-left p-4 rounded-xl border border-surface-200',
                'hover:border-primary-300 hover:bg-primary-50/50',
                'transition-all duration-200 cursor-pointer',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-surface-900">
                    {template.label}
                  </h4>
                  <p className="text-sm text-surface-500 mt-0.5">
                    {template.description}
                  </p>
                </div>
                <Badge color="primary" size="sm">
                  {template.defaultRoles.length} roles
                </Badge>
              </div>
              {template.defaultRoles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {template.defaultRoles.slice(0, 6).map((role) => (
                    <Badge key={role.name} color="default" size="sm">
                      {role.name}
                    </Badge>
                  ))}
                  {template.defaultRoles.length > 6 && (
                    <Badge color="default" size="sm">
                      +{template.defaultRoles.length - 6} more
                    </Badge>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setTemplateOpen(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
