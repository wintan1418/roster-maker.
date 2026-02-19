import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight, Sparkles, Wand2 } from 'lucide-react';
import useAuthStore from '@/stores/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signInWithMagicLink, loading } = useAuthStore();

  const [mode, setMode] = useState('password'); // 'password' | 'magic'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isMagic = mode === 'magic';

  // ── Password sign-in ─────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (!import.meta.env.VITE_SUPABASE_URL) {
      toast.success('Demo mode — navigating to dashboard.');
      navigate('/dashboard');
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message || 'Invalid email or password.');
      return;
    }

    toast.success('Welcome back!');
    navigate('/dashboard');
  };

  // ── Magic-link sign-in ───────────────────────────────────────────────────
  const handleMagicSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email.');
      return;
    }

    if (!import.meta.env.VITE_SUPABASE_URL) {
      toast.success('Demo mode — navigating to dashboard.');
      navigate('/dashboard');
      return;
    }

    const { error } = await signInWithMagicLink(email);

    if (error) {
      toast.error(error.message || 'Failed to send magic link.');
      return;
    }

    toast.success('Check your inbox for the magic link!');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-50">
      {/* ── Decorative background ──────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Gradient mesh */}
        <div className="absolute -top-1/4 -left-1/4 h-[800px] w-[800px] rounded-full bg-primary-400/20 blur-[120px]" />
        <div className="absolute -right-1/4 -bottom-1/4 h-[600px] w-[600px] rounded-full bg-accent-400/20 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/10 blur-[100px]" />

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
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/30">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-surface-500">
            Sign in to your RosterFlow account
          </p>
        </div>

        <Card className="shadow-xl shadow-surface-900/5">
          <form
            onSubmit={isMagic ? handleMagicSubmit : handlePasswordSubmit}
            className="space-y-5"
          >
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

            {/* Password (hidden in magic mode) */}
            {!isMagic && (
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                iconLeft={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            )}

            {/* Submit button */}
            <Button
              type="submit"
              fullWidth
              loading={loading}
              iconRight={isMagic ? Wand2 : ArrowRight}
            >
              {isMagic ? 'Send Magic Link' : 'Sign In'}
            </Button>
          </form>

          {/* ── Divider ──────────────────────────────────────────────────── */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-surface-400">or</span>
            </div>
          </div>

          {/* ── Toggle mode ──────────────────────────────────────────────── */}
          <Button
            type="button"
            variant="outline"
            fullWidth
            iconLeft={isMagic ? Lock : Wand2}
            onClick={() => setMode(isMagic ? 'password' : 'magic')}
          >
            {isMagic ? 'Sign in with Password' : 'Sign in with Magic Link'}
          </Button>
        </Card>

        {/* ── Footer link ──────────────────────────────────────────────────── */}
        <p className="mt-6 text-center text-sm text-surface-500">
          Don&rsquo;t have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
