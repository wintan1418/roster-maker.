import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from '@/stores/authStore';
import {
  Shuffle,
  Users,
  Download,
  Mail,
  ArrowRight,
  CheckCircle2,
  CalendarCheck2,
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const { user, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [initialized, user, navigate]);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full border-b border-surface-200/60 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-sm font-bold text-white">
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

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/40 via-white to-white" />
        <div
          className="pointer-events-none absolute top-20 left-1/2 h-[500px] w-[700px] -translate-x-1/2 opacity-40"
          style={{ background: 'radial-gradient(ellipse at center, var(--color-primary-100) 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-4xl px-4 pb-24 pt-36 sm:px-6 sm:pb-32 sm:pt-44 text-center">
          <p className="animate-fade-in text-xs font-semibold tracking-[0.2em] uppercase text-primary-600 mb-5">
            Roster scheduling for teams
          </p>

          <h1 className="animate-fade-in-up delay-75 text-4xl font-extrabold tracking-tight text-surface-900 leading-[1.1] sm:text-5xl lg:text-[3.5rem]">
            The scheduling tool your{' '}
            <br className="hidden sm:block" />
            team actually wants to use
          </h1>

          <p className="animate-fade-in-up delay-150 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-surface-500">
            RosterFlow takes the pain out of duty rosters. Create teams, set
            availability, and generate fair schedules in minutes — not hours.
          </p>

          <div className="animate-fade-in-up delay-200 mt-10">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-primary-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="animate-fade-in delay-300 mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-surface-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Free to start
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Setup in 2 minutes
            </span>
          </div>

          {/* Abstract roster skeleton */}
          <div className="animate-fade-in-up delay-500 mx-auto mt-16 max-w-2xl">
            <div className="rounded-2xl border border-surface-200/80 bg-white p-5 sm:p-6 shadow-xl shadow-surface-900/5">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-3 w-28 rounded-full bg-surface-200" />
                <div className="ml-auto flex gap-2">
                  <div className="h-7 w-16 rounded-lg bg-primary-50" />
                  <div className="h-7 w-16 rounded-lg bg-surface-50" />
                </div>
              </div>
              {[
                { name: 'w-32', sub: 'w-20', badges: ['bg-primary-100', 'bg-emerald-100', 'bg-amber-100'] },
                { name: 'w-40', sub: 'w-16', badges: ['bg-primary-100', 'bg-violet-100'] },
                { name: 'w-28', sub: 'w-24', badges: ['bg-emerald-100', 'bg-amber-100', 'bg-primary-100'] },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-4 py-3.5 border-t border-surface-100">
                  <div className="h-8 w-8 rounded-full bg-primary-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className={`h-3 rounded-full bg-surface-200 ${row.name}`} />
                    <div className={`mt-2 h-2 rounded-full bg-surface-100 ${row.sub}`} />
                  </div>
                  <div className="hidden sm:flex gap-2">
                    {row.badges.map((c, j) => (
                      <div key={j} className={`h-6 w-14 rounded-md ${c}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section className="bg-surface-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900">
              How it works
            </h2>
            <p className="mt-3 text-lg text-surface-500">
              Three steps to a stress-free schedule
            </p>
          </div>

          <div className="relative mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8">
            {/* Connector line (desktop only) */}
            <div className="absolute top-5 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] hidden sm:block">
              <div className="h-px border-t-2 border-dashed border-surface-300" />
            </div>

            {[
              {
                num: '1',
                title: 'Create your team',
                desc: 'Set up your team and define the roles you need filled each week.',
              },
              {
                num: '2',
                title: 'Add your members',
                desc: 'Invite team members by email. They can set their own availability.',
              },
              {
                num: '3',
                title: 'Generate your roster',
                desc: 'Hit shuffle and RosterFlow assigns members fairly. Publish and share instantly.',
              },
            ].map((step) => (
              <div key={step.num} className="relative text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                  {step.num}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-surface-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-500 max-w-xs mx-auto">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900">
              Built for the way teams actually work
            </h2>
          </div>

          {/* Primary features — large horizontal cards */}
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="group flex flex-col sm:flex-row items-start gap-6 rounded-2xl border border-surface-200 bg-surface-50/50 p-6 sm:p-8 transition-all duration-300 hover:border-primary-200 hover:bg-white hover:shadow-lg">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-100 transition-transform duration-300 group-hover:scale-110">
                <Shuffle className="h-7 w-7 text-primary-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-surface-900">
                  Smart Shuffle
                </h3>
                <p className="mt-2 leading-relaxed text-surface-500">
                  Automatically generate fair, balanced rosters. Our algorithm considers
                  availability, recent assignments, and role requirements to create
                  schedules everyone can live with.
                </p>
              </div>
            </div>

            <div className="group flex flex-col sm:flex-row-reverse items-start gap-6 rounded-2xl border border-surface-200 bg-surface-50/50 p-6 sm:p-8 transition-all duration-300 hover:border-accent-200 hover:bg-white hover:shadow-lg">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-100 transition-transform duration-300 group-hover:scale-110">
                <Users className="h-7 w-7 text-accent-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-surface-900">
                  Team Management
                </h3>
                <p className="mt-2 leading-relaxed text-surface-500">
                  Organize members into teams, assign roles, and manage availability —
                  all in one place. Members get their own portal to see upcoming duties
                  and update their schedule.
                </p>
              </div>
            </div>
          </div>

          {/* Secondary features — compact cards */}
          <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                icon: Download,
                title: 'PDF Exports',
                desc: 'Print-ready rosters, personal schedules, and shareable formats.',
                bg: 'bg-emerald-100',
                color: 'text-emerald-600',
              },
              {
                icon: Mail,
                title: 'Email Notifications',
                desc: 'Automatic notifications when rosters are published or updated.',
                bg: 'bg-violet-100',
                color: 'text-violet-600',
              },
              {
                icon: CalendarCheck2,
                title: 'Availability Tracking',
                desc: 'Members mark their available dates so you never double-book.',
                bg: 'bg-amber-100',
                color: 'text-amber-600',
              },
            ].map(({ icon: Icon, title, desc, bg, color }) => (
              <div
                key={title}
                className="group rounded-2xl border border-surface-200 bg-surface-50/50 p-5 transition-all duration-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
              >
                <div className={`inline-flex rounded-xl p-2.5 ${bg} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-surface-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-surface-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="bg-surface-900 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to simplify your scheduling?
          </h2>
          <p className="mt-4 text-lg text-surface-400">
            Free to use. Set up in under 2 minutes.
          </p>
          <Link
            to="/signup"
            className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-surface-900 shadow-lg transition-all hover:bg-surface-100 hover:shadow-xl hover:-translate-y-0.5"
          >
            Get Started
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-surface-200 bg-white py-10">
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
