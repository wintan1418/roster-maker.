import { useState, useCallback } from 'react';
import { Mail, ArrowRight, AlertCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

/**
 * Email lookup form for personal schedule.
 * Searches the provided members array for a matching email and
 * calls onMemberFound(member) on success.
 *
 * @param {Object}   props
 * @param {Array}    props.members          - [{ id, name, email, roles }]
 * @param {string}   props.organizationName - displayed in the header
 * @param {string}   props.teamName         - displayed in the subheader
 * @param {Function} props.onMemberFound    - (member) => void
 */
export default function EmailLookup({
  members,
  organizationName,
  teamName,
  onMemberFound,
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setError('');

      const trimmed = email.trim().toLowerCase();

      if (!trimmed) {
        setError('Please enter your email address.');
        return;
      }

      // Simple email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setError('Please enter a valid email address.');
        return;
      }

      // Simulate a brief loading state for polish
      setLoading(true);
      setTimeout(() => {
        const found = members.find(
          (m) => m.email.toLowerCase() === trimmed
        );

        if (found) {
          onMemberFound(found);
        } else {
          setError(
            "We couldn't find that email in this roster. Please check the address or contact your team leader."
          );
        }
        setLoading(false);
      }, 600);
    },
    [email, members, onMemberFound]
  );

  return (
    <div className="flex flex-col items-center">
      {/* Icon */}
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 mb-6">
        <Search size={28} className="text-primary-500" />
      </div>

      {/* Heading */}
      <h2 className="text-xl font-bold text-surface-900 text-center">
        View Your Personal Schedule
      </h2>
      <p className="text-sm text-surface-500 mt-2 text-center max-w-md">
        Enter the email address associated with your membership at{' '}
        <span className="font-medium text-surface-700">{organizationName}</span>{' '}
        to view your{' '}
        <span className="font-medium text-surface-700">{teamName}</span>{' '}
        duty schedule.
      </p>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm mt-8 space-y-4"
      >
        <Input
          type="email"
          label="Email Address"
          placeholder="you@example.com"
          iconLeft={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          error={error}
          autoFocus
          autoComplete="email"
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          iconRight={ArrowRight}
        >
          View My Schedule
        </Button>
      </form>

      {/* Hint */}
      <div className="mt-6 flex items-start gap-2 text-xs text-surface-400 max-w-sm">
        <AlertCircle size={14} className="shrink-0 mt-0.5" />
        <p>
          Your email must match the address your team leader used when adding
          you to the roster. If you have trouble, reach out to your team leader
          for help.
        </p>
      </div>
    </div>
  );
}
