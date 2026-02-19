import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Plus,
  FileText,
  UserPlus,
  Eye,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Rocket,
} from 'lucide-react';
import { format } from 'date-fns';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import useAuthStore from '@/stores/authStore';

const QUICK_ACTIONS = [
  {
    label: 'Create Team',
    description: 'Set up a new ministry team',
    icon: Plus,
    to: '/teams',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    label: 'New Roster',
    description: 'Build a new schedule',
    icon: FileText,
    to: '/rosters/new',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    label: 'Invite Members',
    description: 'Add people to your teams',
    icon: UserPlus,
    to: '/teams',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    label: 'View Schedule',
    description: 'Check upcoming rosters',
    icon: Eye,
    to: '/rosters',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
];

const GETTING_STARTED_STEPS = [
  {
    step: 1,
    title: 'Create your first team',
    description: 'Set up a team like Music Ministry, Ushers, or Prayer Team',
    to: '/teams',
    icon: Users,
    cta: 'Create Team',
  },
  {
    step: 2,
    title: 'Add team members',
    description: 'Invite people to your team by email',
    to: '/teams',
    icon: UserPlus,
    cta: 'Add Members',
  },
  {
    step: 3,
    title: 'Build your first roster',
    description: 'Create a schedule and use Smart Shuffle to auto-assign duties',
    to: '/rosters/new',
    icon: Calendar,
    cta: 'Create Roster',
  },
];

export default function Dashboard() {
  const { user, profile } = useAuthStore();

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'there';
  const firstName = displayName.split(' ')[0];

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const formattedDate = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <div className="space-y-8">
      {/* ── Welcome Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
            {greeting}, {firstName}!
          </h1>
          <p className="mt-1 text-surface-500">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <Badge color="success" dot size="md">
            All systems operational
          </Badge>
        </div>
      </div>

      {/* ── Getting Started ─────────────────────────────────────────────── */}
      <Card className="border-primary-200 bg-gradient-to-br from-primary-50/50 to-white">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100">
            <Rocket size={24} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-900">
              Welcome to RosterFlow!
            </h2>
            <p className="text-sm text-surface-500 mt-0.5">
              Let's get your organization set up. Follow these steps to create your first roster.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {GETTING_STARTED_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Link key={step.step} to={step.to} className="group">
                <div className="flex flex-col h-full rounded-xl border border-surface-200 bg-white p-5 transition-all duration-200 hover:border-primary-300 hover:shadow-md">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-600">
                      {step.step}
                    </div>
                    <Icon size={18} className="text-surface-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-surface-500 mt-1 flex-1">
                    {step.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary-600">
                    {step.cta}
                    <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      {/* ── Quick Actions ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-surface-900 mb-3">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} to={action.to} className="group">
                <Card
                  hover
                  className="flex items-center gap-4 group-focus-visible:ring-2 group-focus-visible:ring-primary-500"
                >
                  <div
                    className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-lg ${action.iconBg} transition-transform duration-200 group-hover:scale-110`}
                  >
                    <Icon size={18} className={action.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 group-hover:text-primary-600 transition-colors duration-200">
                      {action.label}
                    </p>
                    <p className="text-xs text-surface-500 truncate">
                      {action.description}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="shrink-0 text-surface-300 group-hover:text-primary-500 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Features Overview ────────────────────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="text-center py-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 mb-4">
            <Sparkles size={24} className="text-violet-600" />
          </div>
          <h3 className="font-semibold text-surface-900">Smart Shuffle</h3>
          <p className="text-sm text-surface-500 mt-1 max-w-xs mx-auto">
            Auto-assign members to duties fairly with our intelligent algorithm
          </p>
        </Card>

        <Card className="text-center py-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 mb-4">
            <CheckCircle2 size={24} className="text-emerald-600" />
          </div>
          <h3 className="font-semibold text-surface-900">Availability Tracking</h3>
          <p className="text-sm text-surface-500 mt-1 max-w-xs mx-auto">
            Members mark their available dates so you never double-book
          </p>
        </Card>

        <Card className="text-center py-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 mb-4">
            <FileText size={24} className="text-blue-600" />
          </div>
          <h3 className="font-semibold text-surface-900">Beautiful Downloads</h3>
          <p className="text-sm text-surface-500 mt-1 max-w-xs mx-auto">
            Export professional PDF and PNG rosters to share with your team
          </p>
        </Card>
      </div>
    </div>
  );
}
