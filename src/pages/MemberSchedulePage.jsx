import { useState, useEffect, useMemo } from 'react';
import {
    Calendar,
    Users,
    User,
    ChevronRight,
    Clock,
    CheckCircle2,
    ArrowRight,
    Music,
    Loader2,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import useAuthStore from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';

export default function MemberSchedulePage() {
    const { user, profile } = useAuthStore();
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [personalAssignments, setPersonalAssignments] = useState([]);
    const [generalRoster, setGeneralRoster] = useState(null);

    // ── Fetch teams the member belongs to ──────────────────────────────────
    useEffect(() => {
        if (!supabase || !user) return;

        async function fetchTeams() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('team_members')
                    .select(`
            id,
            is_team_admin,
            team:teams (
              id,
              name,
              template_type,
              description,
              org_id
            )
          `)
                    .eq('user_id', user.id);

                if (error) throw error;

                const teamList = (data || [])
                    .map((tm) => tm.team)
                    .filter(Boolean);
                setTeams(teamList);

                if (teamList.length > 0 && !selectedTeam) {
                    setSelectedTeam(teamList[0]);
                }
            } catch (err) {
                console.error('Failed to fetch teams:', err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchTeams();
    }, [user]);

    // ── Fetch personal assignments when team changes ───────────────────────
    useEffect(() => {
        if (!supabase || !user || !selectedTeam) return;

        async function fetchAssignments() {
            setLoading(true);
            try {
                // Fetch published rosters for this team
                const { data: rosters, error: rErr } = await supabase
                    .from('rosters')
                    .select('id, title, start_date, end_date, status')
                    .eq('team_id', selectedTeam.id)
                    .eq('status', 'published')
                    .order('start_date', { ascending: false })
                    .limit(5);

                if (rErr) throw rErr;

                if (rosters && rosters.length > 0) {
                    const rosterIds = rosters.map((r) => r.id);

                    // Fetch all events for these rosters
                    const { data: events, error: eErr } = await supabase
                        .from('roster_events')
                        .select('id, roster_id, event_name, event_date, event_time, sort_order')
                        .in('roster_id', rosterIds)
                        .order('event_date', { ascending: true });

                    if (eErr) throw eErr;

                    const eventIds = (events || []).map((e) => e.id);

                    // Fetch MY assignments
                    const { data: myAssignments, error: aErr } = await supabase
                        .from('roster_assignments')
                        .select(`
              id,
              roster_event_id,
              is_manual,
              team_role:team_roles (id, name, category)
            `)
                        .in('roster_event_id', eventIds)
                        .eq('user_id', user.id);

                    if (aErr) throw aErr;

                    // Join the data
                    const enriched = (myAssignments || []).map((a) => {
                        const event = events.find((e) => e.id === a.roster_event_id);
                        const roster = rosters.find((r) => r.id === event?.roster_id);
                        return {
                            ...a,
                            event,
                            roster,
                            date: event?.event_date,
                            eventLabel: event?.event_name,
                            role: a.team_role?.name || 'Unassigned',
                        };
                    });

                    // Sort by date ascending
                    enriched.sort((a, b) => new Date(a.date) - new Date(b.date));
                    setPersonalAssignments(enriched);

                    // For "General" tab — fetch ALL assignments for the latest roster
                    const latestRoster = rosters[0];
                    const latestEvents = (events || []).filter(
                        (e) => e.roster_id === latestRoster.id
                    );
                    const latestEventIds = latestEvents.map((e) => e.id);

                    const { data: allAssignments } = await supabase
                        .from('roster_assignments')
                        .select(`
              id,
              roster_event_id,
              user:profiles (id, full_name, email),
              team_role:team_roles (id, name, category)
            `)
                        .in('roster_event_id', latestEventIds);

                    setGeneralRoster({
                        roster: latestRoster,
                        events: latestEvents,
                        assignments: allAssignments || [],
                    });
                } else {
                    setPersonalAssignments([]);
                    setGeneralRoster(null);
                }
            } catch (err) {
                console.error('Failed to fetch assignments:', err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchAssignments();
    }, [user, selectedTeam]);

    // Split personal by upcoming vs past
    const now = new Date().toISOString().split('T')[0];
    const upcoming = personalAssignments.filter((a) => a.date >= now);
    const past = personalAssignments.filter((a) => a.date < now);

    const tabs = [
        { key: 'personal', label: 'My Schedule', icon: User },
        { key: 'general', label: 'Team Schedule', icon: Users },
    ];

    return (
        <div className="space-y-6">
            {/* ── Header ────────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-surface-900">My Schedule</h1>
                    <p className="text-sm text-surface-500 mt-1">
                        View your upcoming duties and team rosters
                    </p>
                </div>

                {/* Team selector */}
                {teams.length > 1 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-surface-400">Team:</span>
                        <select
                            value={selectedTeam?.id || ''}
                            onChange={(e) => {
                                const t = teams.find((t) => t.id === e.target.value);
                                setSelectedTeam(t);
                            }}
                            className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm text-surface-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
                        >
                            {teams.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────────────── */}
            <div className="flex gap-1 p-1 bg-surface-100 rounded-xl w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
                                activeTab === tab.key
                                    ? 'bg-white text-surface-900 shadow-sm'
                                    : 'text-surface-500 hover:text-surface-700'
                            )}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ── Loading ───────────────────────────────────────────────────────── */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-primary-500" />
                </div>
            )}

            {/* ── No teams ──────────────────────────────────────────────────────── */}
            {!loading && teams.length === 0 && (
                <EmptyState
                    icon={Users}
                    title="No Teams Yet"
                    description="You haven't been added to any teams yet. Ask your team leader to add you."
                />
            )}

            {/* ── Personal tab ──────────────────────────────────────────────────── */}
            {!loading && activeTab === 'personal' && selectedTeam && (
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="flex items-center gap-4 p-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50">
                                <Calendar size={20} className="text-primary-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-surface-900">{upcoming.length}</p>
                                <p className="text-xs text-surface-500">Upcoming duties</p>
                            </div>
                        </Card>
                        <Card className="flex items-center gap-4 p-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50">
                                <CheckCircle2 size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-surface-900">{past.length}</p>
                                <p className="text-xs text-surface-500">Completed duties</p>
                            </div>
                        </Card>
                        <Card className="flex items-center gap-4 p-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-50">
                                <Music size={20} className="text-violet-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-surface-900">{selectedTeam.name}</p>
                                <p className="text-xs text-surface-500">Current team</p>
                            </div>
                        </Card>
                    </div>

                    {/* Upcoming assignments */}
                    {upcoming.length > 0 ? (
                        <div className="space-y-3">
                            <h2 className="text-sm font-semibold text-surface-600 uppercase tracking-wide">
                                Upcoming Duties
                            </h2>
                            <div className="space-y-2">
                                {upcoming.map((duty) => (
                                    <DutyCard key={duty.id} duty={duty} isUpcoming />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Card className="p-8 text-center">
                            <Calendar size={32} className="text-surface-300 mx-auto mb-3" />
                            <p className="text-sm text-surface-500">
                                No upcoming duties scheduled. Check back later!
                            </p>
                        </Card>
                    )}

                    {/* Past assignments */}
                    {past.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wide">
                                Past Duties
                            </h2>
                            <div className="space-y-2 opacity-75">
                                {past.slice(0, 10).map((duty) => (
                                    <DutyCard key={duty.id} duty={duty} isUpcoming={false} />
                                ))}
                                {past.length > 10 && (
                                    <p className="text-xs text-surface-400 text-center py-2">
                                        ...and {past.length - 10} more
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── General tab ───────────────────────────────────────────────────── */}
            {!loading && activeTab === 'general' && selectedTeam && generalRoster && (
                <div className="space-y-4">
                    <Card className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <Calendar size={18} className="text-primary-500" />
                            <div>
                                <h3 className="font-semibold text-surface-900">
                                    {generalRoster.roster.title}
                                </h3>
                                <p className="text-xs text-surface-500">
                                    {generalRoster.roster.start_date} — {generalRoster.roster.end_date}
                                </p>
                            </div>
                        </div>

                        {/* Events as table-like cards */}
                        <div className="space-y-4">
                            {generalRoster.events.map((event) => {
                                const eventAssignments = generalRoster.assignments.filter(
                                    (a) => a.roster_event_id === event.id
                                );

                                return (
                                    <div
                                        key={event.id}
                                        className="border border-surface-200 rounded-xl overflow-hidden"
                                    >
                                        <div className="px-4 py-2.5 bg-surface-50 border-b border-surface-200 flex items-center gap-3">
                                            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-white border border-surface-200">
                                                <span className="text-[10px] font-semibold text-primary-600 uppercase leading-none">
                                                    {formatDate(event.event_date, 'MMM')}
                                                </span>
                                                <span className="text-sm font-bold text-surface-900 leading-none">
                                                    {formatDate(event.event_date, 'd')}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-surface-800 text-sm">
                                                    {event.event_name}
                                                </p>
                                                <p className="text-xs text-surface-400">
                                                    {formatDate(event.event_date, 'EEEE')}
                                                    {event.event_time && ` • ${event.event_time}`}
                                                </p>
                                            </div>
                                        </div>

                                        {eventAssignments.length > 0 ? (
                                            <div className="divide-y divide-surface-100">
                                                {eventAssignments.map((a) => (
                                                    <div
                                                        key={a.id}
                                                        className={cn(
                                                            'flex items-center gap-3 px-4 py-2.5',
                                                            a.user?.id === user?.id && 'bg-primary-50/50'
                                                        )}
                                                    >
                                                        <Avatar
                                                            name={a.user?.full_name || '?'}
                                                            size="sm"
                                                            className="ring-0"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className={cn(
                                                                'text-sm truncate',
                                                                a.user?.id === user?.id
                                                                    ? 'font-semibold text-primary-700'
                                                                    : 'text-surface-700'
                                                            )}>
                                                                {a.user?.full_name || 'Unknown'}
                                                                {a.user?.id === user?.id && (
                                                                    <span className="ml-1.5 text-xs text-primary-500">(You)</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <Badge color="default" size="sm">
                                                            {a.team_role?.name || 'Role'}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="px-4 py-3 text-xs text-surface-400">
                                                No assignments yet
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            )}

            {!loading && activeTab === 'general' && !generalRoster && selectedTeam && (
                <Card className="p-8 text-center">
                    <Calendar size={32} className="text-surface-300 mx-auto mb-3" />
                    <p className="text-sm text-surface-500">
                        No published rosters for this team yet.
                    </p>
                </Card>
            )}
        </div>
    );
}

// ── Duty Card Component ──────────────────────────────────────────────────────

function DutyCard({ duty, isUpcoming }) {
    return (
        <div
            className={cn(
                'flex items-center gap-4 p-4 rounded-xl border transition-colors',
                isUpcoming
                    ? 'border-surface-200 bg-white hover:border-primary-200 hover:bg-primary-50/30'
                    : 'border-surface-200 bg-surface-50'
            )}
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
                    {formatDate(duty.date, 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-xs text-surface-500 mt-0.5">{duty.eventLabel}</p>
                <Badge color="primary" size="sm" className="mt-1.5">
                    {duty.role}
                </Badge>
            </div>

            {/* Status */}
            {isUpcoming ? (
                <Clock size={18} className="text-primary-500 shrink-0" />
            ) : (
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            )}
        </div>
    );
}
