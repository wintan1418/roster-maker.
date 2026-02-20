import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  CalendarDays,
  Plus,
  FileText,
  UserPlus,
  Eye,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Rocket,
  Clock,
  Music,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import useAuthStore from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

// ── Admin-only constants ─────────────────────────────────────────────────────

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
  const { user, profile, orgRole } = useAuthStore();

  const isAdmin = orgRole === 'super_admin' || orgRole === 'team_admin';
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
          <Badge color={isAdmin ? 'success' : 'primary'} dot size="md">
            {isAdmin ? 'Admin' : 'Member'}
          </Badge>
        </div>
      </div>

      {/* ── Member View ──────────────────────────────────────────────────── */}
      {!isAdmin && <MemberDashboard user={user} />}

      {/* ── Admin View ───────────────────────────────────────────────────── */}
      {isAdmin && (
        <>
          {/* Getting Started */}
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

          {/* Quick Actions */}
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

          {/* Features Overview */}
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
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER DASHBOARD — Shows team info, upcoming duties, and schedule link
// ═══════════════════════════════════════════════════════════════════════════════

function MemberDashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [upcomingDuties, setUpcomingDuties] = useState([]);

  useEffect(() => {
    if (!supabase || !user) return;

    async function fetchMemberData() {
      setLoading(true);
      try {
        // 1. Fetch teams the member belongs to
        const { data: teamMemberships } = await supabase
          .from('team_members')
          .select(`
            id,
            is_team_admin,
            team:teams (id, name, template_type, description)
          `)
          .eq('user_id', user.id);

        const teamList = (teamMemberships || [])
          .map((tm) => tm.team)
          .filter(Boolean);
        setTeams(teamList);

        // 2. Fetch upcoming assignments across all teams
        if (teamList.length > 0) {
          const teamIds = teamList.map((t) => t.id);

          const { data: rosters } = await supabase
            .from('rosters')
            .select('id, title, team_id')
            .in('team_id', teamIds)
            .eq('status', 'published');

          if (rosters && rosters.length > 0) {
            const rosterIds = rosters.map((r) => r.id);

            const today = new Date().toISOString().split('T')[0];
            const { data: events } = await supabase
              .from('roster_events')
              .select('id, roster_id, event_name, event_date, event_time')
              .in('roster_id', rosterIds)
              .gte('event_date', today)
              .order('event_date', { ascending: true })
              .limit(20);

            if (events && events.length > 0) {
              const eventIds = events.map((e) => e.id);

              const { data: assignments } = await supabase
                .from('roster_assignments')
                .select(`
                  id,
                  roster_event_id,
                  team_role:team_roles (id, name)
                `)
                .in('roster_event_id', eventIds)
                .eq('user_id', user.id);

              const enriched = (assignments || []).map((a) => {
                const event = events.find((e) => e.id === a.roster_event_id);
                const roster = rosters.find((r) => r.id === event?.roster_id);
                const team = teamList.find((t) => t.id === roster?.team_id);
                return {
                  ...a,
                  date: event?.event_date,
                  eventLabel: event?.event_name,
                  role: a.team_role?.name || 'Duty',
                  teamName: team?.name || '',
                };
              });

              enriched.sort((a, b) => new Date(a.date) - new Date(b.date));
              setUpcomingDuties(enriched.slice(0, 5));
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch member data:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMemberData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Team Cards ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-surface-900 mb-3">
          Your Teams
        </h2>
        {teams.length === 0 ? (
          <Card className="p-8 text-center">
            <Users size={32} className="text-surface-300 mx-auto mb-3" />
            <p className="text-sm text-surface-500">
              You haven't been added to any teams yet. Ask your team leader to invite you.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {teams.map((team) => (
              <Card key={team.id} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 shrink-0">
                  <Music size={20} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-900">{team.name}</p>
                  <p className="text-xs text-surface-500 truncate">
                    {team.description || team.template_type}
                  </p>
                </div>
                <Badge color="primary" size="sm">Member</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Upcoming Duties ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-surface-900">
            Upcoming Duties
          </h2>
          <Link
            to="/my-schedule"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
          >
            View full schedule
            <ArrowRight size={12} />
          </Link>
        </div>

        {upcomingDuties.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar size={32} className="text-surface-300 mx-auto mb-3" />
            <p className="text-sm text-surface-500">
              No upcoming duties scheduled. Check back later!
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {upcomingDuties.map((duty) => (
              <Card
                key={duty.id}
                className="flex items-center gap-4 hover:border-primary-200 transition-colors"
              >
                {/* Date badge */}
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-surface-50 border border-surface-200 shrink-0">
                  <span className="text-xs font-semibold text-primary-600 uppercase">
                    {formatDate(duty.date, 'MMM')}
                  </span>
                  <span className="text-lg font-bold text-surface-900 leading-tight">
                    {formatDate(duty.date, 'd')}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-900 text-sm">
                    {duty.eventLabel}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {formatDate(duty.date, 'EEEE')} • {duty.teamName}
                  </p>
                </div>

                {/* Role badge */}
                <Badge color="primary" size="sm">{duty.role}</Badge>

                {/* Status */}
                <Clock size={16} className="text-primary-400 shrink-0" />
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick link ──────────────────────────────────────────────────── */}
      <Link to="/my-schedule" className="block">
        <Card className="border-primary-200 bg-gradient-to-r from-primary-50/50 to-white hover:border-primary-300 hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 shrink-0">
              <CalendarDays size={22} className="text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-surface-900">
                View Full Schedule
              </p>
              <p className="text-xs text-surface-500">
                See your personal schedule and general team rosters
              </p>
            </div>
            <ArrowRight size={18} className="text-primary-500" />
          </div>
        </Card>
      </Link>
    </div>
  );
}
