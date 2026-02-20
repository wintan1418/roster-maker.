import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from '@/stores/authStore';
import {
  Shuffle,
  Users,
  Download,
  Mail,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const features = [
  {
    icon: Shuffle,
    title: 'Smart Shuffle',
    description:
      'Automatically generate fair, balanced rosters with our intelligent shuffle algorithm. No more manual juggling.',
    color: 'bg-primary-100 text-primary-600',
  },
  {
    icon: Users,
    title: 'Team Management',
    description:
      'Organize members into teams, set roles and availability, and manage your entire organization in one place.',
    color: 'bg-accent-100 text-accent-600',
  },
  {
    icon: Download,
    title: 'Beautiful Downloads',
    description:
      'Export polished, print-ready roster PDFs and spreadsheets. Share them instantly with your team.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Mail,
    title: 'Email Notifications',
    description:
      'Keep everyone in the loop with automatic email notifications when new rosters are published.',
    color: 'bg-violet-100 text-violet-600',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, initialized } = useAuthStore();

  // If the user is already signed in (including after clicking a magic link
  // that redirects back to the homepage), send them straight to the dashboard.
  useEffect(() => {
    if (initialized && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [initialized, user, navigate]);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-surface-200/60 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-sm font-bold text-white">
              RF
            </div>
            <span className="text-xl font-semibold tracking-tight text-surface-900">
              RosterFlow
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:text-surface-900"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50" />
        <div className="absolute top-20 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pb-28 sm:pt-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700">
              <Sparkles className="h-4 w-4" />
              Smart scheduling made simple
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-surface-900 sm:text-5xl lg:text-6xl">
              Effortless{' '}
              <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                Duty Rosters
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-surface-600 sm:text-xl">
              Create fair, balanced duty rosters in seconds. RosterFlow handles the
              scheduling so your team can focus on what matters most.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-surface-300 bg-white px-6 py-3 text-base font-semibold text-surface-700 shadow-sm transition-all hover:border-surface-400 hover:shadow-md"
              >
                Learn More
              </a>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-surface-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Free to start
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Setup in 2 minutes
              </span>
            </div>
          </div>

          {/* Hero visual placeholder */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-2xl shadow-surface-900/10">
              <div className="flex items-center gap-2 border-b border-surface-100 bg-surface-50 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-surface-400">RosterFlow Dashboard</span>
              </div>
              <div className="grid grid-cols-7 gap-px bg-surface-100 p-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="bg-white p-3 text-center text-xs font-medium text-surface-500">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 14 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-white p-3 text-center"
                  >
                    <div className="text-sm text-surface-700">{i + 1}</div>
                    <div
                      className={`mt-1 h-1.5 rounded-full ${
                        i % 3 === 0
                          ? 'bg-primary-400'
                          : i % 3 === 1
                          ? 'bg-accent-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
              Everything you need to manage rosters
            </h2>
            <p className="mt-4 text-lg text-surface-600">
              Powerful features designed to save you hours of scheduling work every week.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="group rounded-2xl border border-surface-200 bg-surface-50/50 p-6 transition-all hover:border-primary-200 hover:bg-white hover:shadow-lg hover:shadow-primary-600/5"
              >
                <div
                  className={`inline-flex rounded-xl p-3 ${color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-surface-900">
                  {title}
                </h3>
                <p className="mt-2 leading-relaxed text-surface-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-surface-900 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Calendar className="mx-auto h-12 w-12 text-primary-400" />
          <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
            Ready to simplify your scheduling?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-surface-300">
            Join teams who save hours every week with RosterFlow's smart roster generation.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary-400 hover:shadow-xl"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-surface-500 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary-500 text-[10px] font-bold text-white">
              RF
            </div>
            <span className="font-medium text-surface-700">RosterFlow</span>
          </div>
          <p className="mt-3">&copy; {new Date().getFullYear()} RosterFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
