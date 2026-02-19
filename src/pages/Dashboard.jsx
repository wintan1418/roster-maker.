import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Calendar,
  Mail,
  Plus,
  FileText,
  UserPlus,
  Eye,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Bell,
  Music,
  Church,
  Star,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { format, formatDistanceToNow, addDays, subHours, subDays, subMinutes } from 'date-fns';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';

// ── Demo Data ────────────────────────────────────────────────────────────────

const CURRENT_USER = {
  name: 'Sarah Mitchell',
  role: 'super_admin',
};

const STATS = [
  {
    label: 'Active Teams',
    value: 6,
    change: '+2 this month',
    changePositive: true,
    icon: Users,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Total Members',
    value: 47,
    change: '+8 from last month',
    changePositive: true,
    icon: UserCheck,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    label: 'Published Rosters',
    value: 12,
    change: '+3 this week',
    changePositive: true,
    icon: Calendar,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    label: 'Pending Invites',
    value: 5,
    change: '2 expiring soon',
    changePositive: false,
    icon: Mail,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
];

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

const now = new Date();

const RECENT_ACTIVITY = [
  {
    id: 1,
    icon: CheckCircle2,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    text: 'Sunday Worship roster published for Feb 23',
    team: 'Music Ministry',
    time: subMinutes(now, 35),
  },
  {
    id: 2,
    icon: UserCheck,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    text: 'John Doe accepted team invite',
    team: 'Sound & Tech',
    time: subHours(now, 2),
  },
  {
    id: 3,
    icon: Plus,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    text: 'New team created: Youth Ministry',
    team: null,
    time: subHours(now, 5),
  },
  {
    id: 4,
    icon: Mail,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    text: 'Invite sent to grace.kim@email.com',
    team: 'Music Ministry',
    time: subHours(now, 8),
  },
  {
    id: 5,
    icon: Bell,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    text: 'Lisa Park marked unavailable for Mar 2',
    team: 'Music Ministry',
    time: subDays(now, 1),
  },
  {
    id: 6,
    icon: CheckCircle2,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    text: 'Mid-week service roster published',
    team: 'Church Events',
    time: subDays(now, 1),
  },
  {
    id: 7,
    icon: Star,
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    text: 'Easter Sunday special roster drafted',
    team: 'Music Ministry',
    time: subDays(now, 2),
  },
  {
    id: 8,
    icon: UserCheck,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    text: 'Michael Chen joined the organization',
    team: null,
    time: subDays(now, 3),
  },
];

const UPCOMING_DUTIES = [
  {
    id: 1,
    title: 'Sunday Morning Worship',
    team: 'Music Ministry',
    teamIcon: Music,
    date: addDays(now, 3),
    roles: 8,
    status: 'published',
  },
  {
    id: 2,
    title: 'Sunday Service Setup',
    team: 'Church Events',
    teamIcon: Church,
    date: addDays(now, 3),
    roles: 5,
    status: 'published',
  },
  {
    id: 3,
    title: 'Wednesday Bible Study',
    team: 'Church Events',
    teamIcon: Church,
    date: addDays(now, 6),
    roles: 3,
    status: 'published',
  },
  {
    id: 4,
    title: 'Youth Friday Gathering',
    team: 'Youth Ministry',
    teamIcon: Users,
    date: addDays(now, 8),
    roles: 6,
    status: 'draft',
  },
  {
    id: 5,
    title: 'Sunday Morning Worship',
    team: 'Music Ministry',
    teamIcon: Music,
    date: addDays(now, 10),
    roles: 8,
    status: 'draft',
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const formattedDate = format(now, 'EEEE, MMMM d, yyyy');

  return (
    <div className="space-y-8">
      {/* ── Welcome Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
            {greeting}, {CURRENT_USER.name.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-surface-500">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <Badge color="success" dot size="md">
            All systems operational
          </Badge>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} hover className="relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-500 truncate">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-surface-900 tracking-tight">
                    {stat.value}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    {stat.changePositive ? (
                      <TrendingUp size={14} className="text-emerald-500 shrink-0" />
                    ) : (
                      <Clock size={14} className="text-amber-500 shrink-0" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        stat.changePositive ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div
                  className={`shrink-0 flex items-center justify-center w-12 h-12 rounded-xl ${stat.iconBg}`}
                >
                  <Icon size={22} className={stat.iconColor} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

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

      {/* ── Main Content: Activity + Upcoming ───────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent Activity (left, wider) */}
        <div className="lg:col-span-3">
          <Card noPadding>
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-surface-100">
              <div>
                <h2 className="text-base font-semibold text-surface-900">
                  Recent Activity
                </h2>
                <p className="text-sm text-surface-500 mt-0.5">
                  Latest updates across your organization
                </p>
              </div>
              <Badge color="info" size="sm">
                {RECENT_ACTIVITY.length} events
              </Badge>
            </div>

            <div className="divide-y divide-surface-100">
              {RECENT_ACTIVITY.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3.5 px-6 py-4 hover:bg-surface-50/50 transition-colors duration-150"
                  >
                    <div
                      className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-lg ${activity.iconBg} mt-0.5`}
                    >
                      <Icon size={16} className={activity.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-800 leading-snug">
                        {activity.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {activity.team && (
                          <Badge color="default" size="sm">
                            {activity.team}
                          </Badge>
                        )}
                        <span className="text-xs text-surface-400">
                          {formatDistanceToNow(activity.time, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3 border-t border-surface-100">
              <button className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200 flex items-center gap-1 cursor-pointer">
                View all activity
                <ChevronRight size={14} />
              </button>
            </div>
          </Card>
        </div>

        {/* Upcoming Duties (right, sidebar) */}
        <div className="lg:col-span-2">
          <Card noPadding>
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-surface-100">
              <div>
                <h2 className="text-base font-semibold text-surface-900">
                  Upcoming Duties
                </h2>
                <p className="text-sm text-surface-500 mt-0.5">
                  Next scheduled events
                </p>
              </div>
              <Link to="/rosters">
                <Button variant="ghost" size="sm" iconRight={ChevronRight}>
                  All
                </Button>
              </Link>
            </div>

            <div className="divide-y divide-surface-100">
              {UPCOMING_DUTIES.map((duty) => {
                const TeamIcon = duty.teamIcon;
                return (
                  <div
                    key={duty.id}
                    className="px-6 py-4 hover:bg-surface-50/50 transition-colors duration-150"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="shrink-0 text-center">
                        <div className="text-xs font-semibold text-primary-600 uppercase">
                          {format(duty.date, 'MMM')}
                        </div>
                        <div className="text-xl font-bold text-surface-900 leading-tight">
                          {format(duty.date, 'd')}
                        </div>
                        <div className="text-xs text-surface-400">
                          {format(duty.date, 'EEE')}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">
                          {duty.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <TeamIcon size={12} className="text-surface-400" />
                          <span className="text-xs text-surface-500">
                            {duty.team}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            color={duty.status === 'published' ? 'success' : 'warning'}
                            size="sm"
                            dot
                          >
                            {duty.status === 'published' ? 'Published' : 'Draft'}
                          </Badge>
                          <span className="text-xs text-surface-400">
                            {duty.roles} roles assigned
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3 border-t border-surface-100">
              <Link to="/rosters">
                <button className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200 flex items-center gap-1 cursor-pointer">
                  View full schedule
                  <ChevronRight size={14} />
                </button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Team Overview Strip ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-surface-900">
            Your Teams
          </h2>
          <Link to="/teams">
            <Button variant="ghost" size="sm" iconRight={ChevronRight}>
              View all
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TeamCard
            name="Music Ministry"
            description="Sunday worship, praise nights, and rehearsals"
            members={['Sarah M.', 'John D.', 'Lisa P.', 'Michael C.', 'Grace K.']}
            memberCount={14}
            rosterCount={5}
            color="bg-violet-500"
          />
          <TeamCard
            name="Sound & Tech"
            description="Audio engineering, livestream, and projection"
            members={['David L.', 'Emma W.', 'James T.']}
            memberCount={8}
            rosterCount={3}
            color="bg-blue-500"
          />
          <TeamCard
            name="Church Events"
            description="Ushers, greeters, and event coordination"
            members={['Rachel A.', 'Thomas B.', 'Anna S.', 'Peter K.']}
            memberCount={12}
            rosterCount={4}
            color="bg-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function TeamCard({ name, description, members, memberCount, rosterCount, color }) {
  return (
    <Link to="/teams" className="group">
      <Card hover className="flex flex-col gap-4 h-full">
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 w-10 h-10 rounded-lg ${color} flex items-center justify-center`}
          >
            <span className="text-white font-bold text-sm">
              {name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-surface-900 group-hover:text-primary-600 transition-colors duration-200 truncate">
              {name}
            </h3>
            <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => (
              <Avatar key={m} name={m} size="sm" />
            ))}
            {memberCount > 4 && (
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-surface-100 text-xs font-semibold text-surface-600 ring-2 ring-white">
                +{memberCount - 4}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-surface-400">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {memberCount}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {rosterCount}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
