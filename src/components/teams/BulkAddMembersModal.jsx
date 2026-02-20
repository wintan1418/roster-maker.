import { useState, useMemo, useCallback } from 'react';
import {
  Upload,
  Users,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Mail,
  User,
  Phone,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const PLACEHOLDER_TEXT = `Paste members here — one per line:
John Doe, john@church.org, +2348012345678
Mary Smith, mary@church.org
David Lee, david@church.org, 08098765432

Format: Name, Email, Phone (phone is optional)`;

function parseMembers(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('//'));

  const members = [];
  const errors = [];

  lines.forEach((line, idx) => {
    // Try comma-separated first, then tab-separated
    const parts = line.includes(',')
      ? line.split(',').map((p) => p.trim())
      : line.split('\t').map((p) => p.trim());

    if (parts.length < 2) {
      errors.push({ line: idx + 1, text: line, reason: 'Need at least name and email' });
      return;
    }

    const [name, email, phone] = parts;

    if (!name) {
      errors.push({ line: idx + 1, text: line, reason: 'Name is missing' });
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ line: idx + 1, text: line, reason: 'Invalid or missing email' });
      return;
    }

    members.push({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
    });
  });

  // Check for duplicate emails
  const seen = new Set();
  const deduped = [];
  members.forEach((m) => {
    if (seen.has(m.email)) {
      errors.push({ line: 0, text: m.email, reason: 'Duplicate email' });
    } else {
      seen.add(m.email);
      deduped.push(m);
    }
  });

  return { members: deduped, errors };
}

export default function BulkAddMembersModal({
  open,
  onClose,
  roles = [],
  existingEmails = [],
  onBulkAdd,
}) {
  const [step, setStep] = useState('input'); // 'input' | 'preview'
  const [rawText, setRawText] = useState('');
  const [parsedMembers, setParsedMembers] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Group roles by category
  const rolesByCategory = useMemo(
    () =>
      roles.reduce((acc, role) => {
        const cat = role.category || 'general';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(role);
        return acc;
      }, {}),
    [roles]
  );

  const handleParse = useCallback(() => {
    if (!rawText.trim()) {
      toast.error('Please paste your member list first.');
      return;
    }

    const { members, errors } = parseMembers(rawText);

    // Filter out members that already exist in the team
    const existingSet = new Set(existingEmails.map((e) => e.toLowerCase()));
    const newMembers = [];
    const alreadyExist = [];

    members.forEach((m) => {
      if (existingSet.has(m.email)) {
        alreadyExist.push(m);
      } else {
        newMembers.push(m);
      }
    });

    if (alreadyExist.length > 0) {
      toast(`${alreadyExist.length} member(s) already in team — skipped`, {
        icon: 'ℹ️',
      });
    }

    setParsedMembers(newMembers);
    setParseErrors(errors);

    if (newMembers.length > 0) {
      setStep('preview');
    } else if (errors.length === 0 && alreadyExist.length > 0) {
      toast.error('All members are already in this team.');
    } else if (errors.length > 0) {
      toast.error('Could not parse any valid members. Check the format.');
    }
  }, [rawText, existingEmails]);

  const handleRemoveMember = useCallback((email) => {
    setParsedMembers((prev) => prev.filter((m) => m.email !== email));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (parsedMembers.length === 0) {
      toast.error('No members to add.');
      return;
    }

    setLoading(true);
    try {
      await onBulkAdd?.(parsedMembers, selectedRoles);
      toast.success(`${parsedMembers.length} member(s) added & invited!`);
      handleClose();
    } catch (err) {
      console.error('Bulk add failed:', err);
      toast.error('Failed to add members. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [parsedMembers, selectedRoles, onBulkAdd]);

  function handleClose() {
    setStep('input');
    setRawText('');
    setParsedMembers([]);
    setParseErrors([]);
    setSelectedRoles([]);
    setLoading(false);
    onClose?.();
  }

  function toggleRole(roleId) {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId]
    );
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === 'input' ? 'Bulk Add Members' : 'Review & Confirm'}
      description={
        step === 'input'
          ? 'Paste a list of members to add them all at once. They will receive an email invite to join.'
          : `${parsedMembers.length} member(s) ready to add. Review and confirm.`
      }
      width="lg"
    >
      {step === 'input' ? (
        <div className="space-y-4">
          {/* Textarea for pasting */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Member List
            </label>
            <textarea
              rows={8}
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-surface-800 placeholder:text-surface-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none resize-none font-mono transition-all duration-200"
              placeholder={PLACEHOLDER_TEXT}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              autoFocus
            />
            <p className="mt-1.5 text-xs text-surface-400">
              Format: <code className="bg-surface-100 px-1 py-0.5 rounded text-surface-600">Name, Email, Phone</code> — one per line. Phone is optional.
            </p>
          </div>

          {/* Role selection */}
          {roles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Assign roles to all members
              </label>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-surface-200 p-3 space-y-3">
                {Object.entries(rolesByCategory).map(
                  ([category, categoryRoles]) => (
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
                  )
                )}
              </div>
              <p className="mt-1.5 text-xs text-surface-400">
                {selectedRoles.length === 0
                  ? 'No roles selected — members will be added without roles'
                  : `${selectedRoles.length} role(s) will be assigned to all members`}
              </p>
            </div>
          )}

          {/* Parse errors from previous attempt */}
          {parseErrors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2 text-red-600 text-sm font-medium mb-2">
                <AlertCircle size={16} />
                {parseErrors.length} line(s) could not be parsed
              </div>
              <div className="space-y-1">
                {parseErrors.slice(0, 5).map((err, i) => (
                  <p key={i} className="text-xs text-red-500">
                    {err.line > 0 ? `Line ${err.line}: ` : ''}{err.reason} — <span className="font-mono">{err.text}</span>
                  </p>
                ))}
                {parseErrors.length > 5 && (
                  <p className="text-xs text-red-400">
                    ...and {parseErrors.length - 5} more errors
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Preview step ─────────────────────────────────────────── */
        <div className="space-y-4">
          {/* Summary badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge color="success" size="md" dot>
              {parsedMembers.length} members ready
            </Badge>
            {selectedRoles.length > 0 && (
              <Badge color="primary" size="md">
                {selectedRoles.length} role(s) assigned
              </Badge>
            )}
            {parseErrors.length > 0 && (
              <Badge color="danger" size="md">
                {parseErrors.length} skipped
              </Badge>
            )}
          </div>

          {/* Member list preview */}
          <div className="max-h-72 overflow-y-auto rounded-xl border border-surface-200 divide-y divide-surface-100">
            {parsedMembers.map((member) => (
              <div
                key={member.email}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors"
              >
                {/* Icon */}
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-50 text-primary-500 shrink-0">
                  <User size={16} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 truncate">
                    {member.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-surface-500">
                    <span className="flex items-center gap-1 truncate">
                      <Mail size={10} />
                      {member.email}
                    </span>
                    {member.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={10} />
                        {member.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.email)}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  aria-label={`Remove ${member.name}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Members already in the system will be added immediately. New members
              will receive a <strong>magic link email</strong> to create their account — no password needed.
            </p>
          </div>

          {/* Parse errors summary */}
          {parseErrors.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                {parseErrors.length} line(s) were skipped due to formatting errors.
              </p>
            </div>
          )}
        </div>
      )}

      <Modal.Footer>
        {step === 'preview' && (
          <Button
            variant="ghost"
            onClick={() => setStep('input')}
            disabled={loading}
            className="mr-auto"
          >
            ← Back
          </Button>
        )}
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {step === 'input' ? (
          <Button onClick={handleParse} iconLeft={Users}>
            Preview Members
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            loading={loading}
            iconLeft={Upload}
            disabled={parsedMembers.length === 0}
          >
            Add {parsedMembers.length} Member{parsedMembers.length !== 1 ? 's' : ''} & Send Invites
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
