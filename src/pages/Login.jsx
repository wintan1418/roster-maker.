import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight, Sparkles, Wand2, Phone, Smartphone } from 'lucide-react';
import useAuthStore from '@/stores/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

// Simple phone number detection
function looksLikePhone(value) {
  const stripped = value.replace(/[\s\-()]/g, '');
  return /^\+?\d{7,15}$/.test(stripped);
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = location.state?.from || '/dashboard';
  const { signIn, signInWithMagicLink, lookupByPhone, loading } = useAuthStore();

  // 'password' | 'magic' | 'quick'
  const [mode, setMode] = useState('quick');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [identifier, setIdentifier] = useState(''); // email OR phone for quick mode

  // Pre-fill from invite URL param
  useEffect(() => {
    const prefillEmail = searchParams.get('email');
    if (prefillEmail) {
      setIdentifier(prefillEmail);
      setEmail(prefillEmail);
      setMode('quick');
    }
  }, [searchParams]);

  // ── Quick login (email or phone → magic link) ───────────────────────────
  const handleQuickSubmit = async (e) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error('Please enter your email or phone number.');
      return;
    }

    if (!import.meta.env.VITE_SUPABASE_URL) {
      toast.success('Demo mode — navigating to dashboard.');
      navigate(from, { replace: true });
      return;
    }

    const isPhone = looksLikePhone(identifier.trim());

    if (isPhone) {
      // Look up email by phone number, then send magic link
      const { email: foundEmail, error: lookupError } = await lookupByPhone(identifier.trim());
      if (lookupError || !foundEmail) {
        toast.error(lookupError?.message || 'No account found with that phone number.');
        return;
      }

      const { error } = await signInWithMagicLink(foundEmail);
      if (error) {
        toast.error(error.message || 'Failed to send magic link.');
        return;
      }

      toast.success(`Magic link sent to the email associated with this phone number!`);
    } else {
      // Treat as email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) {
        toast.error('Please enter a valid email address or phone number.');
        return;
      }

      const { error } = await signInWithMagicLink(identifier.trim());
      if (error) {
        toast.error(error.message || 'Failed to send magic link.');
        return;
      }

      toast.success('Check your inbox for the magic link!');
    }
  };

  // ── Password sign-in ─────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (!import.meta.env.VITE_SUPABASE_URL) {
      toast.success('Demo mode — navigating to dashboard.');
      navigate(from, { replace: true });
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message || 'Invalid email or password.');
      return;
    }

    toast.success('Welcome back!');
    navigate(from, { replace: true });
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
      navigate(from, { replace: true });
      return;
    }

    const { error } = await signInWithMagicLink(email);

    if (error) {
      toast.error(error.message || 'Failed to send magic link.');
      return;
    }

    toast.success('Check your inbox for the magic link!');
  };

  const isQuick = mode === 'quick';
  const isMagic = mode === 'magic';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-50">
      {/* ── Decorative background ──────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 h-[800px] w-[800px] rounded-full bg-primary-400/20 blur-[120px] animate-blob" />
        <div className="absolute -right-1/4 -bottom-1/4 h-[600px] w-[600px] rounded-full bg-accent-400/20 blur-[120px] animate-blob-alt" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/10 blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />
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
        <div className="animate-fade-in-up mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/30">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900">
            {isQuick ? 'Sign in to RosterFlow' : 'Welcome back'}
          </h1>
          <p className="mt-1.5 text-sm text-surface-500">
            {isQuick
              ? 'Enter your email or phone number — no password needed'
              : 'Sign in to your RosterFlow account'}
          </p>
        </div>

        <Card className="animate-fade-in-up delay-150 shadow-xl shadow-surface-900/5">
          {/* ── Quick login form (default) ──────────────────────────────── */}
          {isQuick && (
            <form onSubmit={handleQuickSubmit} className="space-y-5">
              <Input
                label="Email or Phone Number"
                type="text"
                placeholder="you@example.com or +234..."
                iconLeft={Smartphone}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="email tel"
                required
                autoFocus
              />

              <p className="text-xs text-surface-400 -mt-2">
                We'll send a magic link to your email. If you enter a phone number, we'll find your email and send the link there.
              </p>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                iconRight={Wand2}
              >
                Send Magic Link
              </Button>
            </form>
          )}

          {/* ── Password form ──────────────────────────────────────────── */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
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
              <Button
                type="submit"
                fullWidth
                loading={loading}
                iconRight={ArrowRight}
              >
                Sign In
              </Button>
            </form>
          )}

          {/* ── Magic link form ─────────────────────────────────────────── */}
          {isMagic && (
            <form onSubmit={handleMagicSubmit} className="space-y-5">
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
              <Button
                type="submit"
                fullWidth
                loading={loading}
                iconRight={Wand2}
              >
                Send Magic Link
              </Button>
            </form>
          )}

          {/* ── Divider ──────────────────────────────────────────────────── */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-surface-400">or sign in with</span>
            </div>
          </div>

          {/* ── Toggle mode buttons ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2">
            {mode !== 'quick' && (
              <Button
                type="button"
                variant="outline"
                fullWidth
                iconLeft={Smartphone}
                onClick={() => setMode('quick')}
                className="text-xs"
              >
                Email / Phone
              </Button>
            )}
            {mode !== 'password' && (
              <Button
                type="button"
                variant="outline"
                fullWidth
                iconLeft={Lock}
                onClick={() => setMode('password')}
                className="text-xs"
              >
                Password
              </Button>
            )}
            {mode !== 'magic' && (
              <Button
                type="button"
                variant="outline"
                fullWidth
                iconLeft={Wand2}
                onClick={() => setMode('magic')}
                className="text-xs"
              >
                Magic Link
              </Button>
            )}
          </div>
        </Card>

        {/* ── Footer link ──────────────────────────────────────────────────── */}
        <p className="animate-fade-in delay-300 mt-6 text-center text-sm text-surface-500">
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
