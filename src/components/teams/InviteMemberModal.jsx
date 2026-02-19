import { useState } from 'react';
import { Mail, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function InviteMemberModal({ open, onClose, roles = [], onInvite }) {
  const [form, setForm] = useState({
    email: '',
    name: '',
    phone: '',
  });
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function toggleRole(roleId) {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId]
    );
  }

  function validate() {
    const newErrors = {};
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (onInvite) {
        await onInvite({
          ...form,
          email: form.email.trim(),
          name: form.name.trim(),
          phone: form.phone.trim(),
          roles: selectedRoles,
        });
      }
      toast.success(
        form.name
          ? `Invitation sent to ${form.name}`
          : `Invitation sent to ${form.email}`
      );
      handleClose();
    } catch {
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setForm({ email: '', name: '', phone: '' });
    setSelectedRoles([]);
    setErrors({});
    setLoading(false);
    onClose?.();
  }

  // Group roles by category
  const rolesByCategory = roles.reduce((acc, role) => {
    const cat = role.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(role);
    return acc;
  }, {});

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Invite Member"
      description="Add a new member to this team. They'll receive an email invitation."
      width="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          name="email"
          type="email"
          placeholder="member@church.org"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          iconLeft={Mail}
          required
        />

        <Input
          label="Full name"
          name="name"
          type="text"
          placeholder="John Doe"
          value={form.name}
          onChange={handleChange}
          iconLeft={User}
        />

        <Input
          label="Phone (optional)"
          name="phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          value={form.phone}
          onChange={handleChange}
          iconLeft={Phone}
        />

        {/* Role selection */}
        {roles.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Assign roles
            </label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-surface-200 p-3 space-y-3">
              {Object.entries(rolesByCategory).map(([category, categoryRoles]) => (
                <div key={category}>
                  <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
                    {category}
                  </p>
                  <div className="space-y-1">
                    {categoryRoles.map((role) => (
                      <label
                        key={role.id}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-surface-50 cursor-pointer transition-colors duration-150"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role.id)}
                          onChange={() => toggleRole(role.id)}
                          className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                        <span className="text-sm text-surface-700">
                          {role.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-surface-400">
              {selectedRoles.length === 0
                ? 'No roles selected'
                : `${selectedRoles.length} role${selectedRoles.length > 1 ? 's' : ''} selected`}
            </p>
          </div>
        )}
      </form>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          loading={loading}
          iconLeft={loading ? undefined : Mail}
        >
          Send Invite
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
