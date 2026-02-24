import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Building2, ArrowRight, Sparkles } from 'lucide-react';
import useAuthStore from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { ROLES } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function Signup() {
  const navigate = useNavigate();
  const { signUp, loading } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isLoading = loading || submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── Validation ──────────────────────────────────────────────────────────
    if (!fullName.trim() || !email || !password || !orgName.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (!termsAccepted) {
      toast.error('You must accept the terms to continue.');
      return;
    }

    setSubmitting(true);

    try {
      if (!supabase) {
        // Demo mode — no Supabase configured
        toast.success('Demo mode — navigating to dashboard.');
        navigate('/dashboard');
        return;
      }

      // 1. Create the Supabase auth user
      const { data: authData, error: authError } = await signUp(
        email,
        password,
        fullName
      );

      if (authError) throw authError;

      const userId = authData?.user?.id;
      if (!userId) {
        toast.success(
          'Check your email to confirm your account, then sign in.'
        );
        navigate('/login');
        return;
      }

      // 2. Upsert the profile row (trigger may have already created one)
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: fullName.trim(),
        email,
        role: ROLES.SUPER_ADMIN,
      });

      if (profileError) throw profileError;

      // 3. Create the organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgName.trim(), created_by: userId })
        .select()
        .single();

      if (orgError) throw orgError;

      // 4. Add the user as a super_admin member of the new org
      const { error: memberError } = await supabase
        .from('org_members')
        .insert({
          organization_id: org.id,
          user_id: userId,
          role: ROLES.SUPER_ADMIN,
        });

      if (memberError) throw memberError;

      toast.success('Account created! Welcome to RosterFlow.');
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup failed:', err);
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-50">
      {/* ── Decorative background ──────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Gradient mesh */}
        <div className="absolute -top-1/4 -right-1/4 h-[800px] w-[800px] rounded-full bg-accent-400/20 blur-[120px] animate-blob" />
        <div className="absolute -bottom-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-primary-400/20 blur-[120px] animate-blob-alt" />
        <div className="absolute top-1/3 left-1/3 h-[350px] w-[350px] rounded-full bg-emerald-400/10 blur-[100px] animate-blob" style={{ animationDelay: '3s' }} />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle, var(--color-surface-300) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* ── Card ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-md px-4 py-10">
        {/* Branding */}
        <div className="animate-fade-in-up mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/30">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-surface-500">
            Get started with RosterFlow in seconds
          </p>
        </div>

        <Card className="animate-fade-in-up delay-150 shadow-xl shadow-surface-900/5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full name */}
            <Input
              label="Full name"
              type="text"
              placeholder="Jane Smith"
              iconLeft={User}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />

            {/* Email */}
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              iconLeft={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            {/* Password */}
            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              iconLeft={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            {/* Organization name */}
            <Input
              label="Organization name"
              type="text"
              placeholder="e.g. Grace Community Church"
              iconLeft={Building2}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              helperText="You can invite team members after setup."
              required
            />

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-surface-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
              <span className="text-sm text-surface-500 leading-snug group-hover:text-surface-600 transition-colors">
                I agree to the{' '}
                <button
                  type="button"
                  className="font-medium text-primary-600 hover:text-primary-700 underline underline-offset-2"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  className="font-medium text-primary-600 hover:text-primary-700 underline underline-offset-2"
                >
                  Privacy Policy
                </button>
              </span>
            </label>

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              disabled={!termsAccepted}
              iconRight={ArrowRight}
            >
              Create Account
            </Button>
          </form>
        </Card>

        {/* ── Footer link ──────────────────────────────────────────────────── */}
        <p className="animate-fade-in delay-300 mt-6 text-center text-sm text-surface-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
