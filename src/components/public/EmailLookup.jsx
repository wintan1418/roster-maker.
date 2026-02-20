import { useState, useCallback } from 'react';
import { Mail, ArrowRight, AlertCircle, Search, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

function looksLikePhone(value) {
  const stripped = value.replace(/[\s\-()]/g, '');
  return /^\+?\d{7,15}$/.test(stripped);
}

/**
 * Email/Phone lookup form for personal schedule.
 * Searches the provided members array for a matching email or phone,
 * and calls onMemberFound(member) on success.
 */
export default function EmailLookup({
  members,
  organizationName,
  teamName,
  onMemberFound,
}) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setError('');

      const trimmed = input.trim();

      if (!trimmed) {
        setError('Please enter your email address or phone number.');
        return;
      }

      const isPhone = looksLikePhone(trimmed);

      if (!isPhone && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setError('Please enter a valid email address or phone number.');
        return;
      }

      // Simulate a brief loading state for polish
      setLoading(true);
      setTimeout(() => {
        let found;

        if (isPhone) {
          // Look up by phone
          const normalized = trimmed.replace(/[\s\-()]/g, '');
          found = members.find(
            (m) =>
              m.phone &&
              m.phone.replace(/[\s\-()]/g, '') === normalized
          );
        } else {
          // Look up by email
          found = members.find(
            (m) => m.email.toLowerCase() === trimmed.toLowerCase()
          );
        }

        if (found) {
          onMemberFound(found);
        } else {
          setError(
            isPhone
              ? "We couldn't find that phone number in this roster. Please check the number or contact your team leader."
              : "We couldn't find that email in this roster. Please check the address or contact your team leader."
          );
        }
        setLoading(false);
      }, 600);
    },
    [input, members, onMemberFound]
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
        Enter the email or phone number associated with your membership at{' '}
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
          type="text"
          label="Email or Phone Number"
          placeholder="you@example.com or +234..."
          iconLeft={Mail}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError('');
          }}
          error={error}
          autoFocus
          autoComplete="email tel"
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
          Your email or phone number must match what your team leader used when
          adding you to the roster. If you have trouble, reach out to your team
          leader for help.
        </p>
      </div>
    </div>
  );
}
