import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  UserPlus,
  CheckCircle2,
  XCircle,
  Music,
  Mail,
  User,
  ArrowRight,
  PartyPopper,
  Church,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';

// ─── Demo invitation data ───────────────────────────────────────────────────

const DEMO_INVITE = {
  organization: {
    name: 'Grace Community Church',
    address: '1425 Maple Avenue, Springfield, IL 62704',
  },
  team: {
    name: 'Music Ministry',
    memberCount: 8,
    description: 'Sunday services, worship nights, and music rehearsals',
  },
  invitedBy: {
    name: 'Pastor David Mitchell',
    role: 'Team Admin',
    email: 'david.mitchell@gracecommunity.org',
  },
  role: 'Member',
  expiresAt: '2026-03-15',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function InvitePage() {
  const { token } = useParams();

  // 'pending' | 'signup' | 'accepted' | 'declined'
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(false);

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const handleAccept = useCallback(() => {
    // In a real app this would check if the user is logged in.
    // For the demo we show the inline signup form.
    setStatus('signup');
  }, []);

  const handleDecline = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setStatus('declined');
      setLoading(false);
    }, 600);
  }, []);

  const handleSignupSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const errors = {};

      if (!signupForm.name.trim()) errors.name = 'Name is required.';
      if (!signupForm.email.trim()) errors.email = 'Email is required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email.trim()))
        errors.email = 'Enter a valid email address.';
      if (!signupForm.password.trim()) errors.password = 'Password is required.';
      else if (signupForm.password.length < 6)
        errors.password = 'Password must be at least 6 characters.';

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setFormErrors({});
      setLoading(true);

      // Simulate account creation + invitation acceptance
      setTimeout(() => {
        setStatus('accepted');
        setLoading(false);
      }, 1200);
    },
    [signupForm]
  );

  const updateField = useCallback((field, value) => {
    setSignupForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const invite = DEMO_INVITE;

  // ── Accepted state ────────────────────────────────────────────────────────
  if (status === 'accepted') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto inline-flex rounded-2xl bg-emerald-50 p-4">
            <PartyPopper className="h-10 w-10 text-emerald-500" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-surface-900">
            Welcome to the team!
          </h1>

          <p className="mt-3 text-surface-600">
            You have successfully joined{' '}
            <span className="font-semibold">{invite.team.name}</span> at{' '}
            <span className="font-semibold">{invite.organization.name}</span>.
          </p>

          <div className="mt-6 p-4 bg-emerald-50 rounded-xl">
            <div className="flex items-center justify-center gap-2 text-emerald-700">
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">
                Invitation accepted successfully
              </span>
            </div>
          </div>

          <Link to="/dashboard">
            <Button
              variant="primary"
              fullWidth
              iconRight={ArrowRight}
              className="mt-6"
            >
              Go to Dashboard
            </Button>
          </Link>

          <p className="mt-4 text-xs text-surface-400">
            Your team leader will be notified that you've joined.
          </p>
        </div>
      </div>
    );
  }

  // ── Declined state ────────────────────────────────────────────────────────
  if (status === 'declined') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto inline-flex rounded-2xl bg-surface-100 p-4">
            <XCircle className="h-10 w-10 text-surface-400" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-surface-900">
            Invitation Declined
          </h1>

          <p className="mt-3 text-surface-600">
            You've declined the invitation to join{' '}
            <span className="font-semibold">{invite.team.name}</span>.
            If you change your mind, ask your team leader to send a new
            invitation.
          </p>

          <Link to="/">
            <Button variant="outline" fullWidth className="mt-6">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Pending / Signup state ────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Main invitation card */}
        <Card className="overflow-hidden" noPadding>
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary-500 via-primary-400 to-violet-500" />

          <div className="p-6 sm:p-8">
            {/* Icon + heading */}
            <div className="text-center mb-6">
              <div className="mx-auto inline-flex rounded-2xl bg-primary-50 p-4 mb-4">
                <UserPlus className="h-10 w-10 text-primary-500" />
              </div>
              <h1 className="text-2xl font-bold text-surface-900">
                You're Invited!
              </h1>
              <p className="text-surface-500 mt-1">
                You've been invited to join a team on RosterFlow
              </p>
            </div>

            {/* Invitation details */}
            <div className="space-y-4 mb-6">
              {/* Organization */}
              <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-500 text-white shrink-0">
                  <Church size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-surface-900">
                    {invite.organization.name}
                  </p>
                  <p className="text-xs text-surface-500 truncate">
                    {invite.organization.address}
                  </p>
                </div>
              </div>

              {/* Team */}
              <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-500 text-white shrink-0">
                  <Music size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-surface-900">
                      {invite.team.name}
                    </p>
                    <Badge color="primary" size="sm">
                      {invite.team.memberCount} members
                    </Badge>
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {invite.team.description}
                  </p>
                </div>
              </div>

              {/* Invited by */}
              <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                <Avatar name={invite.invitedBy.name} size="md" className="ring-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-surface-900">
                    Invited by{' '}
                    <span className="font-semibold">{invite.invitedBy.name}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge color="default" size="sm">
                      <Shield size={10} />
                      {invite.invitedBy.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Signup form (shown when status === 'signup') ────────────── */}
            {status === 'signup' && (
              <div className="mb-6">
                <div className="border-t border-surface-200 pt-6 mb-4">
                  <h2 className="text-base font-semibold text-surface-900">
                    Create your account to accept
                  </h2>
                  <p className="text-sm text-surface-500 mt-1">
                    Set up your RosterFlow account to join the team.
                  </p>
                </div>

                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    iconLeft={User}
                    value={signupForm.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    error={formErrors.name}
                    autoComplete="name"
                  />

                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="you@example.com"
                    iconLeft={Mail}
                    value={signupForm.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    error={formErrors.email}
                    autoComplete="email"
                  />

                  <Input
                    type="password"
                    label="Password"
                    placeholder="At least 6 characters"
                    value={signupForm.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    error={formErrors.password}
                    autoComplete="new-password"
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={loading}
                    iconRight={ArrowRight}
                  >
                    Create Account & Join Team
                  </Button>
                </form>

                <p className="text-xs text-center text-surface-400 mt-3">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Log in
                  </Link>{' '}
                  to accept this invitation.
                </p>
              </div>
            )}

            {/* ── Accept / Decline buttons (pending state) ───────────────── */}
            {status === 'pending' && (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  fullWidth
                  iconRight={ArrowRight}
                  onClick={handleAccept}
                  size="lg"
                >
                  Accept Invitation
                </Button>

                <Button
                  variant="ghost"
                  fullWidth
                  onClick={handleDecline}
                  loading={loading}
                  className="text-surface-500"
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Footer note */}
        <p className="text-center text-xs text-surface-400 mt-4">
          Powered by{' '}
          <Link to="/" className="font-medium text-primary-600 hover:text-primary-700">
            RosterFlow
          </Link>{' '}
          &mdash; Effortless Duty Rosters
        </p>
      </div>
    </div>
  );
}
