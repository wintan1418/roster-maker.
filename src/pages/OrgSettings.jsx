import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Settings,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Camera,
  Palette,
  Trash2,
  Shield,
  Save,
  AlertTriangle,
  Check,
  ChevronDown,
  Loader2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import { LoadingBlock } from '@/components/ui/LoadingSpinner';
import useAuthStore from '@/stores/authStore';
import useOrgStore from '@/stores/orgStore';

// ── Constants ────────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  { name: 'Blue', value: '#2563eb', bg: 'bg-blue-600' },
  { name: 'Indigo', value: '#4f46e5', bg: 'bg-indigo-600' },
  { name: 'Violet', value: '#7c3aed', bg: 'bg-violet-600' },
  { name: 'Purple', value: '#9333ea', bg: 'bg-purple-600' },
  { name: 'Pink', value: '#db2777', bg: 'bg-pink-600' },
  { name: 'Rose', value: '#e11d48', bg: 'bg-rose-600' },
  { name: 'Orange', value: '#ea580c', bg: 'bg-orange-600' },
  { name: 'Amber', value: '#d97706', bg: 'bg-amber-600' },
  { name: 'Emerald', value: '#059669', bg: 'bg-emerald-600' },
  { name: 'Teal', value: '#0d9488', bg: 'bg-teal-600' },
  { name: 'Cyan', value: '#0891b2', bg: 'bg-cyan-600' },
  { name: 'Slate', value: '#475569', bg: 'bg-slate-600' },
];

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  team_admin: 'Team Admin',
  member: 'Member',
};

const ROLE_COLORS = {
  super_admin: 'error',
  team_admin: 'primary',
  member: 'default',
};

// ── Component ────────────────────────────────────────────────────────────────

export default function OrgSettings() {
  const orgId = useAuthStore((s) => s.orgId);
  const {
    organization,
    members: storeMembers,
    loading,
    fetchOrganization,
    fetchMembers,
    updateOrganization,
    updateMemberRole,
  } = useOrgStore();

  const [org, setOrg] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    tagline: '',
    primaryColor: '#2563eb',
    logoUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [editingRoleId, setEditingRoleId] = useState(null);
  const fileInputRef = useRef(null);

  // ── Fetch organization & members on mount ───────────────────────────────
  useEffect(() => {
    if (orgId) {
      fetchOrganization(orgId);
      fetchMembers(orgId);
    }
  }, [orgId, fetchOrganization, fetchMembers]);

  // ── Sync local form state when organization loads / updates ─────────────
  useEffect(() => {
    if (organization) {
      const s = organization.settings || {};
      setOrg({
        name: organization.name || '',
        description: s.description || '',
        email: s.email || '',
        phone: s.phone || '',
        address: s.address || '',
        website: s.website || '',
        tagline: s.tagline || '',
        primaryColor: s.primaryColor || '#2563eb',
        logoUrl: s.logoUrl || '',
      });
    }
  }, [organization]);

  // ── Map store members to table-friendly shape ───────────────────────────
  const members = useMemo(
    () =>
      storeMembers.map((m) => ({
        id: m.id,
        name: m.profile?.full_name || 'Unknown',
        email: m.profile?.email || '',
        role: m.role,
        status: 'active',
        joinedAt: m.created_at,
      })),
    [storeMembers]
  );

  const handleOrgChange = useCallback((field, value) => {
    setOrg((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      const { error } = await updateOrganization(orgId, {
        name: org.name,
        settings: {
          description: org.description,
          email: org.email,
          phone: org.phone,
          address: org.address,
          website: org.website,
          tagline: org.tagline,
          primaryColor: org.primaryColor,
          logoUrl: org.logoUrl,
        },
      });
      if (error) throw error;
      toast.success('Organization settings saved successfully');
    } catch {
      toast.error('Failed to save organization settings');
    } finally {
      setSaving(false);
    }
  }, [orgId, org, updateOrganization]);

  const handleLogoUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }

    setLogoUploading(true);

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      // Scale to max 256×256 for crisp display at 96×96
      const MAX = 256;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png', 0.9);
      setOrg((prev) => ({ ...prev, logoUrl: dataUrl }));
      setLogoUploading(false);
      toast.success('Logo ready — click Save Changes to confirm');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setLogoUploading(false);
      toast.error('Could not read image file');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    img.src = objectUrl;
  }, []);

  const handleRemoveLogo = useCallback(() => {
    setOrg((prev) => ({ ...prev, logoUrl: '' }));
    toast('Logo removed — click Save Changes to confirm', { icon: 'ℹ️' });
  }, []);

  const handleRoleChange = useCallback(async (memberId, newRole) => {
    setEditingRoleId(null);
    const { error } = await updateMemberRole(memberId, newRole);
    if (error) {
      toast.error('Failed to update role');
    } else {
      toast.success('Member role updated');
    }
  }, [updateMemberRole]);

  const handleDeleteOrg = useCallback(() => {
    if (deleteConfirmText === org.name) {
      setDeleteModalOpen(false);
      setDeleteConfirmText('');
      toast.success('Organization deletion requested');
    }
  }, [deleteConfirmText, org.name]);

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading && !organization) {
    return <LoadingBlock label="Loading organization settings..." />;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight flex items-center gap-2.5">
            <Settings size={24} className="text-surface-400" />
            Organization Settings
          </h1>
          <p className="mt-1 text-surface-500">
            Manage your organization details, branding, and members
          </p>
        </div>
        <Button
          variant="primary"
          iconLeft={Save}
          loading={saving}
          onClick={handleSave}
          className="mt-3 sm:mt-0"
        >
          Save Changes
        </Button>
      </div>

      {/* ── Organization Details ──────────────────────────────────────────── */}
      <Card>
        <Card.Header>
          <div>
            <Card.Title>
              <span className="flex items-center gap-2">
                <Building2 size={18} className="text-surface-400" />
                Organization Details
              </span>
            </Card.Title>
            <Card.Description>
              Basic information about your organization
            </Card.Description>
          </div>
        </Card.Header>

        <Card.Body className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Logo Upload */}
            <div className="shrink-0">
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Logo
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <div className="relative group">
                <div
                  onClick={() => !logoUploading && fileInputRef.current?.click()}
                  className={clsx(
                    'w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200',
                    logoUploading
                      ? 'border-surface-300 bg-surface-50 cursor-wait'
                      : 'cursor-pointer hover:border-primary-400 hover:bg-primary-50/50',
                    org.logoUrl
                      ? 'border-surface-300 bg-white overflow-hidden p-0'
                      : 'border-dashed border-surface-300 bg-surface-100'
                  )}
                >
                  {logoUploading ? (
                    <Loader2 size={20} className="text-primary-500 animate-spin" />
                  ) : org.logoUrl ? (
                    <img
                      src={org.logoUrl}
                      alt="Org logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <>
                      <Camera
                        size={20}
                        className="text-surface-400 group-hover:text-primary-500 transition-colors duration-200"
                      />
                      <span className="text-xs text-surface-400 mt-1 group-hover:text-primary-500 transition-colors duration-200">
                        Upload
                      </span>
                    </>
                  )}
                </div>
                {org.logoUrl && !logoUploading && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow cursor-pointer hover:bg-red-600 transition-colors"
                    title="Remove logo"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-surface-400">Max 2 MB</p>
            </div>

            <div className="flex-1 space-y-4">
              <Input
                label="Organization Name"
                value={org.name}
                onChange={(e) => handleOrgChange('name', e.target.value)}
                iconLeft={Building2}
              />
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={org.description}
                  onChange={(e) => handleOrgChange('description', e.target.value)}
                  rows={3}
                  className={clsx(
                    'block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-surface-900',
                    'placeholder:text-surface-400',
                    'transition-all duration-200 ease-in-out',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    'border-surface-300 focus:border-primary-500 focus:ring-primary-500/25',
                    'resize-none'
                  )}
                />
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* ── Contact Information ───────────────────────────────────────────── */}
      <Card>
        <Card.Header>
          <div>
            <Card.Title>
              <span className="flex items-center gap-2">
                <Mail size={18} className="text-surface-400" />
                Contact Information
              </span>
            </Card.Title>
            <Card.Description>
              How people can reach your organization
            </Card.Description>
          </div>
        </Card.Header>

        <Card.Body className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Email Address"
              type="email"
              value={org.email}
              onChange={(e) => handleOrgChange('email', e.target.value)}
              iconLeft={Mail}
            />
            <Input
              label="Phone Number"
              type="tel"
              value={org.phone}
              onChange={(e) => handleOrgChange('phone', e.target.value)}
              iconLeft={Phone}
            />
          </div>
          <Input
            label="Address"
            value={org.address}
            onChange={(e) => handleOrgChange('address', e.target.value)}
            iconLeft={MapPin}
          />
          <Input
            label="Website"
            type="url"
            value={org.website}
            onChange={(e) => handleOrgChange('website', e.target.value)}
            iconLeft={Globe}
          />
        </Card.Body>
      </Card>

      {/* ── Branding ─────────────────────────────────────────────────────── */}
      <Card>
        <Card.Header>
          <div>
            <Card.Title>
              <span className="flex items-center gap-2">
                <Palette size={18} className="text-surface-400" />
                Branding
              </span>
            </Card.Title>
            <Card.Description>
              Customize the look and feel of your organization
            </Card.Description>
          </div>
        </Card.Header>

        <Card.Body className="space-y-5">
          <Input
            label="Tagline"
            value={org.tagline}
            onChange={(e) => handleOrgChange('tagline', e.target.value)}
            helperText="A short phrase that represents your organization"
          />

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Primary Color
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleOrgChange('primaryColor', color.value)}
                  className={clsx(
                    'w-9 h-9 rounded-lg transition-all duration-200 cursor-pointer',
                    'hover:scale-110 hover:shadow-md',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500',
                    color.bg,
                    org.primaryColor === color.value &&
                      'ring-2 ring-offset-2 ring-surface-900 scale-110'
                  )}
                  title={color.name}
                >
                  {org.primaryColor === color.value && (
                    <Check size={16} className="text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-surface-400">
              Selected: {COLOR_PRESETS.find((c) => c.value === org.primaryColor)?.name || 'Custom'}{' '}
              ({org.primaryColor})
            </p>

            {/* Color preview */}
            <div className="mt-4 rounded-xl border border-surface-200 overflow-hidden">
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: org.primaryColor }}
              >
                <span className="text-white text-sm font-semibold">{org.name || 'Your Organization'}</span>
                <span className="text-white/80 text-xs">Roster Preview</span>
              </div>
              <div className="px-4 py-3 bg-white flex items-center justify-between">
                <span className="text-surface-600 text-sm">Sunday Service · 09:00</span>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full text-white"
                  style={{ backgroundColor: org.primaryColor }}
                >
                  Published
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs text-surface-400">
              This color is used on published roster pages and shared links.
            </p>
          </div>
        </Card.Body>
      </Card>

      {/* ── Members ──────────────────────────────────────────────────────── */}
      <Card noPadding>
        <div className="px-6 pt-6 pb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-surface-200">
          <div>
            <h3 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
              <Shield size={18} className="text-surface-400" />
              Members
            </h3>
            <p className="text-sm text-surface-500 mt-0.5">
              {members.length} members in your organization
            </p>
          </div>
          <Badge color="info" size="md">
            {members.filter((m) => m.status === 'active').length} active
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-surface-500 uppercase">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-surface-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-surface-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold tracking-wide text-surface-500 uppercase">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-surface-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-surface-500 truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setEditingRoleId(
                            editingRoleId === member.id ? null : member.id
                          )
                        }
                        className="inline-flex items-center gap-1.5 cursor-pointer group"
                      >
                        <Badge
                          color={ROLE_COLORS[member.role]}
                          size="md"
                        >
                          {ROLE_LABELS[member.role]}
                        </Badge>
                        <ChevronDown
                          size={14}
                          className="text-surface-400 group-hover:text-surface-600 transition-colors duration-200"
                        />
                      </button>
                      {editingRoleId === member.id && (
                        <RoleDropdown
                          currentRole={member.role}
                          onSelect={(role) => handleRoleChange(member.id, role)}
                          onClose={() => setEditingRoleId(null)}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      color={member.status === 'active' ? 'success' : 'warning'}
                      size="sm"
                      dot
                    >
                      {member.status === 'active' ? 'Active' : 'Invited'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-surface-500">
                    {new Date(member.joinedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Danger Zone ──────────────────────────────────────────────────── */}
      <Card className="border-red-200 bg-red-50/30">
        <Card.Header className="border-red-200">
          <div>
            <Card.Title>
              <span className="flex items-center gap-2 text-red-700">
                <AlertTriangle size={18} />
                Danger Zone
              </span>
            </Card.Title>
            <Card.Description>
              Irreversible and destructive actions
            </Card.Description>
          </div>
        </Card.Header>

        <Card.Body>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-surface-900">
                Delete this organization
              </p>
              <p className="text-sm text-surface-500 mt-0.5">
                Once deleted, all teams, rosters, and member data will be permanently removed.
              </p>
            </div>
            <Button
              variant="danger"
              iconLeft={Trash2}
              onClick={() => setDeleteModalOpen(true)}
              className="shrink-0"
            >
              Delete Organization
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* ── Delete Confirmation Modal ────────────────────────────────────── */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteConfirmText('');
        }}
        title="Delete Organization"
        description="This action cannot be undone. All data will be permanently deleted."
        width="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  You are about to delete "{org.name}"
                </p>
                <p className="text-sm text-red-700 mt-1">
                  This will permanently remove all teams, rosters, members, and associated data.
                  This action is irreversible.
                </p>
              </div>
            </div>
          </div>

          <Input
            label={
              <>
                Type <span className="font-semibold">{org.name}</span> to confirm
              </>
            }
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={org.name}
          />
        </div>

        <Modal.Footer>
          <Button
            variant="outline"
            onClick={() => {
              setDeleteModalOpen(false);
              setDeleteConfirmText('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            iconLeft={Trash2}
            disabled={deleteConfirmText !== org.name}
            onClick={handleDeleteOrg}
          >
            Delete Organization
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bottom spacer so the danger zone isn't at the very bottom of the viewport */}
      <div className="h-4" />
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function RoleDropdown({ currentRole, onSelect, onClose }) {
  const roles = ['super_admin', 'team_admin', 'member'];

  return (
    <>
      {/* Backdrop to close dropdown */}
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute left-0 top-full mt-1 z-20 w-44 bg-white rounded-lg shadow-lg border border-surface-200 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => onSelect(role)}
            className={clsx(
              'w-full px-3 py-2 text-left text-sm transition-colors duration-150 cursor-pointer',
              'hover:bg-surface-50 flex items-center justify-between',
              role === currentRole && 'bg-surface-50'
            )}
          >
            <span className="text-surface-700">{ROLE_LABELS[role]}</span>
            {role === currentRole && (
              <Check size={14} className="text-primary-600" />
            )}
          </button>
        ))}
      </div>
    </>
  );
}
