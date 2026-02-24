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
  AlertTriangle,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
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
  const { user, profile, orgRole, orgId } = useAuthStore();

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

          {/* Delete Requests — super_admin only */}
          {orgRole === 'super_admin' && <DeleteRequestsPanel orgId={orgId} />}

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
// DELETE REQUESTS PANEL — super_admin only
// ═══════════════════════════════════════════════════════════════════════════════

function DeleteRequestsPanel({ orgId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null); // request id being acted on

  useEffect(() => {
    if (!supabase || !orgId) return;
    setLoading(true);
    supabase
      .from('delete_requests')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRequests(data ?? []);
        setLoading(false);
      });
  }, [orgId]);

  async function executeDelete(req) {
    if (!supabase) return;
    try {
      if (req.target_type === 'team') {
        await supabase.from('teams').delete().eq('id', req.target_id);
      } else if (req.target_type === 'member') {
        await supabase.from('team_members').delete().eq('id', req.target_id);
      } else if (req.target_type === 'role') {
        await supabase.from('team_roles').delete().eq('id', req.target_id);
      }
    } catch {
      // Deletion might fail if already gone — treat as success
    }
  }

  async function handleApprove(req) {
    setActing(req.id);
    try {
      await executeDelete(req);
      await supabase
        .from('delete_requests')
        .update({ status: 'approved', resolved_at: new Date().toISOString() })
        .eq('id', req.id);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast.success(`Approved: ${req.target_name} deleted`);
    } catch {
      toast.error('Failed to approve request');
    } finally {
      setActing(null);
    }
  }

  async function handleReject(req) {
    setActing(req.id);
    try {
      await supabase
        .from('delete_requests')
        .update({ status: 'rejected', resolved_at: new Date().toISOString() })
        .eq('id', req.id);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast.success('Request rejected');
    } catch {
      toast.error('Failed to reject request');
    } finally {
      setActing(null);
    }
  }

  if (loading || requests.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-orange-500" />
        <h2 className="text-base font-semibold text-surface-900">
          Pending Deletion Requests
        </h2>
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
          {requests.length}
        </span>
      </div>
      <div className="space-y-2">
        {requests.map((req) => (
          <Card key={req.id} className="border-orange-200 bg-orange-50/30">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 shrink-0">
                <AlertTriangle size={18} className="text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-900">
                  Delete {req.target_type}: <span className="text-orange-700">{req.target_name}</span>
                </p>
                <p className="text-xs text-surface-500 mt-0.5">
                  Requested by <span className="font-medium">{req.requester_name}</span>
                  {' · '}{formatDate(req.created_at)}
                </p>
                {req.reason && (
                  <p className="text-xs text-surface-600 mt-1 italic">"{req.reason}"</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleReject(req)}
                  disabled={acting === req.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-600 border border-surface-200 hover:bg-surface-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <X size={13} />
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(req)}
                  disabled={acting === req.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Check size={13} />
                  Approve & Delete
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
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
  const [songsByEvent, setSongsByEvent] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

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
              .select('id, roster_id, event_name, event_date, event_time, rehearsal_time')
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

              // Fetch songs for all events
              const { data: songRows } = await supabase
                .from('event_songs')
                .select('id, roster_event_id, title, artist, key, link, sort_order, added_by')
                .in('roster_event_id', eventIds)
                .order('sort_order');

              const sMap = {};
              for (const s of (songRows ?? [])) {
                if (!sMap[s.roster_event_id]) sMap[s.roster_event_id] = [];
                sMap[s.roster_event_id].push(s);
              }
              setSongsByEvent(sMap);

              const enriched = (assignments || []).map((a) => {
                const event = events.find((e) => e.id === a.roster_event_id);
                const roster = rosters.find((r) => r.id === event?.roster_id);
                const team = teamList.find((t) => t.id === roster?.team_id);
                const isWorshipRole = (a.team_role?.name || '').toLowerCase().includes('worship') ||
                  (a.team_role?.name || '').toLowerCase().includes('leader');
                return {
                  ...a,
                  eventId: event?.id,
                  date: event?.event_date,
                  eventLabel: event?.event_name,
                  eventTime: event?.event_time,
                  rehearsalTime: event?.rehearsal_time,
                  role: a.team_role?.name || 'Duty',
                  teamName: team?.name || '',
                  teamId: team?.id,
                  isWorshipLeader: isWorshipRole,
                };
              });

              enriched.sort((a, b) => new Date(a.date) - new Date(b.date));
              setUpcomingDuties(enriched.slice(0, 10));
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
  }, [user, refreshKey]);

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
              <DutyCard
                key={duty.id}
                duty={duty}
                songs={songsByEvent[duty.eventId] || []}
                userId={user.id}
                onSongChange={() => setRefreshKey((k) => k + 1)}
              />
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

// ── Duty Card with songs display + song entry for worship leaders ──────────

function DutyCard({ duty, songs, userId, onSongChange }) {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [link, setLink] = useState('');
  const [adding, setAdding] = useState(false);

  const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h, 10);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  async function handleAddSong(e) {
    e.preventDefault();
    if (!title.trim() || !supabase || !duty.eventId) return;
    setAdding(true);
    const { error } = await supabase.from('event_songs').insert({
      roster_event_id: duty.eventId,
      team_id: duty.teamId,
      title: title.trim(),
      artist: artist.trim() || null,
      key: key.trim() || null,
      link: link.trim() || null,
      sort_order: songs.length,
      added_by: userId,
    });
    if (error) {
      toast.error(error.message || 'Failed to add song');
    } else {
      toast.success('Song added!');
      setTitle(''); setArtist(''); setKey(''); setLink('');
      setShowForm(false);
      onSongChange?.();
    }
    setAdding(false);
  }

  async function handleDeleteSong(songId) {
    if (!supabase) return;
    await supabase.from('event_songs').delete().eq('id', songId);
    toast.success('Song removed');
    onSongChange?.();
  }

  return (
    <Card className="hover:border-primary-200 transition-colors">
      <div className="flex items-center gap-4">
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
            {formatDate(duty.date, 'EEEE')} {duty.eventTime ? `• ${fmtTime(duty.eventTime)}` : ''} • {duty.teamName}
          </p>
          {duty.rehearsalTime && (
            <p className="text-xs text-amber-600 mt-0.5">Rehearsal: {fmtTime(duty.rehearsalTime)}</p>
          )}
          {/* Song summary */}
          {songs.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-violet-600 mt-1 hover:text-violet-700 cursor-pointer"
            >
              <Music size={11} />
              {songs.length} song{songs.length !== 1 ? 's' : ''}
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          )}
        </div>

        {/* Role badge */}
        <Badge color={duty.isWorshipLeader ? 'warning' : 'primary'} size="sm">{duty.role}</Badge>
      </div>

      {/* Expanded songs list */}
      {expanded && songs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-surface-100 space-y-1.5">
          {songs.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-violet-50/50">
              <span className="text-xs font-bold text-surface-300 w-4 text-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-surface-800 truncate">{s.title}</p>
                <p className="text-[10px] text-surface-400 truncate">
                  {s.artist && <span>{s.artist}</span>}
                  {s.key && <span className="ml-1 font-mono text-violet-600">Key: {s.key}</span>}
                </p>
              </div>
              {s.link && (
                <a href={s.link} target="_blank" rel="noopener noreferrer" className="p-0.5 text-violet-400 hover:text-violet-600">
                  <ExternalLink size={12} />
                </a>
              )}
              {s.added_by === userId && (
                <button onClick={() => handleDeleteSong(s.id)} className="p-0.5 text-surface-300 hover:text-red-500 cursor-pointer">
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Song entry for worship leaders */}
      {duty.isWorshipLeader && (
        <div className="mt-3 pt-3 border-t border-surface-100">
          {!showForm ? (
            <button
              onClick={() => { setShowForm(true); setExpanded(true); }}
              className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium cursor-pointer"
            >
              <Plus size={13} /> Add Song
            </button>
          ) : (
            <form onSubmit={handleAddSong} className="space-y-2">
              <input
                value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Song title *" autoFocus
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-200 bg-surface-50 text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-1 focus:ring-violet-300"
              />
              <div className="flex gap-1.5">
                <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist"
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-surface-200 bg-surface-50 text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-1 focus:ring-violet-300" />
                <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Key"
                  className="w-16 px-2.5 py-1.5 text-xs rounded-lg border border-surface-200 bg-surface-50 text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-1 focus:ring-violet-300" />
              </div>
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (YouTube, Spotify...)"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-200 bg-surface-50 text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-1 focus:ring-violet-300" />
              <div className="flex gap-1.5">
                <button type="submit" disabled={!title.trim() || adding}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1">
                  <Plus size={12} /> Add
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 text-xs rounded-lg text-surface-500 hover:bg-surface-100 transition-colors cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </Card>
  );
}
