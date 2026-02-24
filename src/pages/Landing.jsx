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
  UserPlus,
  Zap,
  Shield,
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

          {/* Product mockup */}
          <div className="animate-fade-in-up delay-500 mx-auto mt-16 max-w-3xl px-2">
            <div className="rounded-2xl border border-surface-200 bg-white shadow-2xl shadow-surface-900/8 overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-surface-100 bg-surface-50 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-surface-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-surface-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-surface-300" />
                </div>
                <div className="ml-3 flex-1">
                  <div className="mx-auto max-w-xs h-5 rounded-md bg-surface-100 flex items-center justify-center">
                    <span className="text-[10px] text-surface-400">rosterflow.app/rosters</span>
                  </div>
                </div>
              </div>

              {/* Roster table */}
              <div className="p-4 sm:p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-semibold text-surface-900">Sunday Service — March 2026</h4>
                    <p className="text-[11px] text-surface-400 mt-0.5">Music Ministry</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Published
                    </span>
                    <div className="hidden sm:flex h-7 items-center gap-1 rounded-md bg-primary-50 px-2.5 text-[10px] font-medium text-primary-600">
                      <Shuffle className="h-3 w-3" />
                      Shuffle
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border border-surface-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-surface-50">
                        <th className="px-3 py-2 font-semibold text-surface-500 w-[30%]">Role</th>
                        <th className="px-3 py-2 font-semibold text-surface-500 text-center">Mar 2</th>
                        <th className="px-3 py-2 font-semibold text-surface-500 text-center">Mar 9</th>
                        <th className="px-3 py-2 font-semibold text-surface-500 text-center hidden sm:table-cell">Mar 16</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {[
                        { role: 'Worship Leader', people: ['Sarah A.', 'David K.', 'Sarah A.'], color: 'bg-primary-50 text-primary-700' },
                        { role: 'Keyboardist', people: ['Emmanuel B.', 'Grace O.', 'Emmanuel B.'], color: 'bg-violet-50 text-violet-700' },
                        { role: 'Drummer', people: ['John M.', 'John M.', 'Felix T.'], color: 'bg-amber-50 text-amber-700' },
                        { role: 'Vocalist', people: ['Rachel N.', 'Deborah E.', 'Rachel N.'], color: 'bg-emerald-50 text-emerald-700' },
                      ].map((row) => (
                        <tr key={row.role} className="hover:bg-surface-50/50">
                          <td className="px-3 py-2.5 font-medium text-surface-800">{row.role}</td>
                          {row.people.map((person, j) => (
                            <td key={j} className={`px-3 py-2.5 text-center ${j === 2 ? 'hidden sm:table-cell' : ''}`}>
                              <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-medium ${row.color}`}>
                                {person}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section className="bg-surface-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary-600 mb-3">
              Simple setup
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-surface-900">
              Up and running in 3 steps
            </h2>
          </div>

          <div className="relative mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
            {/* Connector line (desktop only) */}
            <div className="absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] hidden sm:block">
              <div className="h-px border-t-2 border-dashed border-surface-300" />
            </div>

            {[
              {
                num: '1',
                icon: Users,
                title: 'Create your team',
                desc: 'Set up your team and define the roles you need filled each week.',
                accent: 'bg-primary-600',
              },
              {
                num: '2',
                icon: UserPlus,
                title: 'Add your members',
                desc: 'Invite members by email or phone. They can set their own availability.',
                accent: 'bg-primary-600',
              },
              {
                num: '3',
                icon: Zap,
                title: 'Generate your roster',
                desc: 'Hit shuffle and get a fair schedule instantly. Publish and share with one click.',
                accent: 'bg-primary-600',
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="relative text-center">
                  <div className={`relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${step.accent} text-white shadow-lg shadow-primary-600/20`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 flex h-5 w-5 items-center justify-center rounded-full bg-white border-2 border-primary-200 text-[10px] font-bold text-primary-600 z-20">
                    {step.num}
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-surface-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-surface-500 max-w-[260px] mx-auto">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary-600 mb-3">
              Features
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-surface-900">
              Everything you need, nothing you don't
            </h2>
            <p className="mt-3 text-lg text-surface-500 max-w-xl mx-auto">
              Powerful tools designed for churches, ministries, and teams that need reliable scheduling.
            </p>
          </div>

          {/* Feature grid */}
          <div className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shuffle,
                title: 'Smart Shuffle',
                desc: 'Auto-generate fair rosters that consider availability, recent assignments, and role requirements.',
                bg: 'bg-primary-50',
                iconBg: 'bg-primary-100',
                color: 'text-primary-600',
                border: 'hover:border-primary-200',
              },
              {
                icon: Users,
                title: 'Team Management',
                desc: 'Organize members, assign roles, and give everyone their own portal to view duties.',
                bg: 'bg-accent-50',
                iconBg: 'bg-accent-100',
                color: 'text-accent-600',
                border: 'hover:border-accent-200',
              },
              {
                icon: CalendarCheck2,
                title: 'Availability Tracking',
                desc: 'Members mark available dates so you never schedule someone who can\'t make it.',
                bg: 'bg-amber-50',
                iconBg: 'bg-amber-100',
                color: 'text-amber-600',
                border: 'hover:border-amber-200',
              },
              {
                icon: Download,
                title: 'PDF & Print Export',
                desc: 'Download polished, print-ready rosters and personal schedules as PDFs.',
                bg: 'bg-emerald-50',
                iconBg: 'bg-emerald-100',
                color: 'text-emerald-600',
                border: 'hover:border-emerald-200',
              },
              {
                icon: Mail,
                title: 'Email Notifications',
                desc: 'Automatic notifications when new rosters are published or schedules change.',
                bg: 'bg-violet-50',
                iconBg: 'bg-violet-100',
                color: 'text-violet-600',
                border: 'hover:border-violet-200',
              },
              {
                icon: Shield,
                title: 'Review & Approval',
                desc: 'Share draft rosters for review. Reviewers can approve, request changes, or leave comments.',
                bg: 'bg-rose-50',
                iconBg: 'bg-rose-100',
                color: 'text-rose-600',
                border: 'hover:border-rose-200',
              },
            ].map(({ icon: Icon, title, desc, iconBg, color, border }) => (
              <div
                key={title}
                className={`group rounded-2xl border border-surface-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${border}`}
              >
                <div className={`inline-flex rounded-xl p-3 ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-surface-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-surface-900 py-20 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.15)_0%,_transparent_60%)]" />
        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/20 ring-1 ring-primary-400/30">
            <Zap className="h-7 w-7 text-primary-400" />
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Stop juggling spreadsheets.
            <br />
            <span className="text-primary-400">Start scheduling smarter.</span>
          </h2>
          <p className="mt-5 text-lg text-surface-400 max-w-md mx-auto">
            Join teams already saving hours every week with RosterFlow. Free to start, no credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-surface-900 shadow-lg transition-all hover:bg-surface-100 hover:shadow-xl hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="text-sm text-surface-500">Setup in under 2 minutes</p>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-surface-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-500 text-[10px] font-bold text-white">
                RF
              </div>
              <span className="font-semibold text-surface-800">RosterFlow</span>
            </div>
            <p className="text-sm text-surface-400">
              &copy; {new Date().getFullYear()} RosterFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
