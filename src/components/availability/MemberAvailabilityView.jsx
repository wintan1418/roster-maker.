import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Loader2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Calendar,
  Save,
  Inbox,
  Users,
  ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { supabase } from '@/lib/supabase';
import useAuthStore from '@/stores/authStore';
import { formatDate, getSessionFromTime, getInitials } from '@/lib/utils';

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

const SESSION_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  all_day: 'All Day',
};

export default function MemberAvailabilityView() {
  const { user, orgRole } = useAuthStore();
  const isAdmin = orgRole === 'super_admin' || orgRole === 'team_admin';

  const [loading, setLoading] = useState(true);
  const [rosters, setRosters] = useState([]);
  const [teamMembers, setTeamMembers] = useState({}); // { teamId: [{ user_id, name }] }
  // { `${rosterId}::${userId}`: { "date::session": boolean } }
  const [availabilityMap, setAvailabilityMap] = useState({});
  // Which member is selected per roster card: { rosterId: userId }
  const [selectedMember, setSelectedMember] = useState({});
  const [savingKey, setSavingKey] = useState(null);

  // Get the effective user_id for a roster (selected member or self)
  const getEffectiveUserId = useCallback((rosterId) => {
    return selectedMember[rosterId] || user?.id;
  }, [selectedMember, user?.id]);

  // Availability key for a roster + user
  const getAvailKey = useCallback((rosterId, userId) => `${rosterId}::${userId}`, []);

  useEffect(() => {
    if (!supabase || !user?.id) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        // 1. Get user's team memberships
        const { data: memberships } = await supabase
          .from('team_members')
          .select('team_id, teams(id, name)')
          .eq('user_id', user.id);

        const teams = (memberships ?? []).map((m) => ({
          id: m.team_id,
          name: m.teams?.name || '',
        }));
        const teamIds = teams.map((t) => t.id);
        if (teamIds.length === 0) {
          if (!cancelled) { setRosters([]); setLoading(false); }
          return;
        }

        // 2. Get active rosters
        const today = new Date().toISOString().split('T')[0];
        const { data: rosterRows } = await supabase
          .from('rosters')
          .select('id, title, team_id, start_date, end_date, status')
          .in('team_id', teamIds)
          .in('status', ['draft', 'published'])
          .gte('end_date', today)
          .order('start_date', { ascending: true });

        if (cancelled) return;

        if (!rosterRows || rosterRows.length === 0) {
          setRosters([]);
          setLoading(false);
          return;
        }

        // 3. Fetch events for all rosters
        const rosterIds = rosterRows.map((r) => r.id);
        const { data: eventRows } = await supabase
          .from('roster_events')
          .select('id, roster_id, event_name, event_date, event_time, sort_order')
          .in('roster_id', rosterIds)
          .order('event_date')
          .order('sort_order');

        if (cancelled) return;

        // 4. If admin, fetch all team members for those teams
        let membersMap = {};
        if (isAdmin) {
          const { data: allMembers } = await supabase
            .from('team_members')
            .select('team_id, user_id, profile:profiles(full_name)')
            .in('team_id', teamIds);

          if (cancelled) return;

          for (const m of allMembers ?? []) {
            if (!membersMap[m.team_id]) membersMap[m.team_id] = [];
            membersMap[m.team_id].push({
              user_id: m.user_id,
              name: m.profile?.full_name || 'Unknown',
            });
          }
          // Sort each team's members alphabetically
          for (const tid of Object.keys(membersMap)) {
            membersMap[tid].sort((a, b) => a.name.localeCompare(b.name));
          }
        }

        // 5. Fetch existing availability — for self (always) + all members if admin
        let availQuery = supabase
          .from('availability')
          .select('user_id, date, session, is_available, team_id')
          .in('team_id', teamIds);

        if (!isAdmin) {
          availQuery = availQuery.eq('user_id', user.id);
        }

        const { data: availRows } = await availQuery;
        if (cancelled) return;

        // Build existing lookup: "userId::teamId::date::session" → is_available
        const existingLookup = {};
        for (const row of availRows ?? []) {
          existingLookup[`${row.user_id}::${row.team_id}::${row.date}::${row.session}`] = row.is_available;
        }

        // Group events by roster_id
        const eventsByRoster = {};
        for (const evt of eventRows ?? []) {
          if (!eventsByRoster[evt.roster_id]) eventsByRoster[evt.roster_id] = [];
          eventsByRoster[evt.roster_id].push(evt);
        }

        // Build team name lookup
        const teamNameMap = {};
        for (const t of teams) teamNameMap[t.id] = t.name;

        // Build enriched rosters
        const enrichedRosters = [];
        const availMap = {};

        for (const r of rosterRows) {
          const rEvents = (eventsByRoster[r.id] ?? []).sort(
            (a, b) => a.event_date.localeCompare(b.event_date) || (a.sort_order ?? 0) - (b.sort_order ?? 0)
          );
          if (rEvents.length === 0) continue;

          enrichedRosters.push({
            ...r,
            team_name: teamNameMap[r.team_id] || '',
            events: rEvents,
          });

          // Build availability for self
          const selfKey = `${r.id}::${user.id}`;
          availMap[selfKey] = buildRosterAvail(rEvents, r.team_id, user.id, existingLookup);

          // Build availability for all team members if admin
          if (isAdmin && membersMap[r.team_id]) {
            for (const m of membersMap[r.team_id]) {
              if (m.user_id === user.id) continue; // already done
              const mKey = `${r.id}::${m.user_id}`;
              availMap[mKey] = buildRosterAvail(rEvents, r.team_id, m.user_id, existingLookup);
            }
          }
        }

        if (!cancelled) {
          setRosters(enrichedRosters);
          setTeamMembers(membersMap);
          setAvailabilityMap(availMap);
          // Default selected member to self for each roster
          const defaultSelected = {};
          for (const r of enrichedRosters) defaultSelected[r.id] = user.id;
          setSelectedMember(defaultSelected);
        }
      } catch (err) {
        console.error('Failed to load availability:', err);
        toast.error('Failed to load availability data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [user?.id, isAdmin]);

  const handleToggle = useCallback((rosterId, dateSessionKey) => {
    setAvailabilityMap((prev) => {
      const userId = selectedMember[rosterId] || user?.id;
      const key = `${rosterId}::${userId}`;
      return {
        ...prev,
        [key]: {
          ...prev[key],
          [dateSessionKey]: !prev[key]?.[dateSessionKey],
        },
      };
    });
  }, [selectedMember, user?.id]);

  const handleMarkAll = useCallback((rosterId) => {
    setAvailabilityMap((prev) => {
      const userId = selectedMember[rosterId] || user?.id;
      const key = `${rosterId}::${userId}`;
      const rosterAvail = { ...prev[key] };
      for (const k of Object.keys(rosterAvail)) rosterAvail[k] = true;
      return { ...prev, [key]: rosterAvail };
    });
  }, [selectedMember, user?.id]);

  const handleSelectMember = useCallback((rosterId, userId) => {
    setSelectedMember((prev) => ({ ...prev, [rosterId]: userId }));
  }, []);

  const handleSave = useCallback(async (rosterId) => {
    const roster = rosters.find((r) => r.id === rosterId);
    const effectiveUserId = selectedMember[rosterId] || user?.id;
    const availKey = `${rosterId}::${effectiveUserId}`;
    const avail = availabilityMap[availKey];
    if (!roster || !avail || !supabase || !effectiveUserId) return;

    setSavingKey(availKey);
    try {
      const rows = Object.entries(avail).map(([key, isAvailable]) => {
        const [date, session] = key.split('::');
        return {
          user_id: effectiveUserId,
          team_id: roster.team_id,
          date,
          session,
          is_available: isAvailable,
          reason: isAvailable ? null : 'Marked via availability page',
        };
      });

      const { error: upsertErr } = await supabase
        .from('availability')
        .upsert(rows, { onConflict: 'user_id,team_id,date,session' });

      if (upsertErr) throw upsertErr;

      const memberName = effectiveUserId === user?.id
        ? 'you'
        : (teamMembers[roster.team_id]?.find((m) => m.user_id === effectiveUserId)?.name || 'member');
      toast.success(`Availability saved for ${memberName}!`);
    } catch (err) {
      console.error('Failed to save availability:', err);
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingKey(null);
    }
  }, [rosters, availabilityMap, selectedMember, user?.id, teamMembers]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={32} className="animate-spin text-primary-500" />
        <span className="text-surface-500">Loading availability...</span>
      </div>
    );
  }

  // ── Empty state ──
  if (rosters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center">
          <Inbox size={32} className="text-surface-400" />
        </div>
        <h2 className="text-lg font-bold text-surface-900">No Active Rosters</h2>
        <p className="text-sm text-surface-500">
          {isAdmin
            ? 'Create a roster with events and it will appear here.'
            : 'When your team admin creates a roster, it will appear here for you to mark your availability.'}
        </p>
      </div>
    );
  }

  // ── Roster cards ──
  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <CalendarCheck size={22} className="text-primary-500" />
          Availability
        </h1>
        <p className="text-sm text-surface-500 mt-1">
          {isAdmin
            ? 'Mark availability for yourself or your team members'
            : 'Mark your availability for upcoming rosters'}
        </p>
      </div>

      {rosters.map((roster) => {
        const effectiveUserId = selectedMember[roster.id] || user?.id;
        const availKey = `${roster.id}::${effectiveUserId}`;
        return (
          <RosterCard
            key={roster.id}
            roster={roster}
            availability={availabilityMap[availKey] || {}}
            saving={savingKey === availKey}
            onToggle={(key) => handleToggle(roster.id, key)}
            onMarkAll={() => handleMarkAll(roster.id)}
            onSave={() => handleSave(roster.id)}
            isAdmin={isAdmin}
            members={teamMembers[roster.team_id] || []}
            selectedUserId={effectiveUserId}
            currentUserId={user?.id}
            onSelectMember={(userId) => handleSelectMember(roster.id, userId)}
          />
        );
      })}
    </div>
  );
}

// ── Helper: build per-roster availability for a specific user ────────────────

function buildRosterAvail(events, teamId, userId, existingLookup) {
  const avail = {};
  for (const event of events) {
    const session = getSessionFromTime(event.event_time);
    const key = `${event.event_date}::${session}`;
    if (key in avail) continue;
    const lookupKey = `${userId}::${teamId}::${event.event_date}::${session}`;
    avail[key] = existingLookup[lookupKey] !== false;
  }
  return avail;
}

// ── Per-roster checklist card ────────────────────────────────────────────────

function RosterCard({
  roster, availability, saving, onToggle, onMarkAll, onSave,
  isAdmin, members, selectedUserId, currentUserId, onSelectMember,
}) {
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const totalSessions = Object.keys(availability).length;
  const availableCount = Object.values(availability).filter(Boolean).length;

  const selectedMemberName = useMemo(() => {
    if (selectedUserId === currentUserId) return 'Yourself';
    return members.find((m) => m.user_id === selectedUserId)?.name || 'Unknown';
  }, [selectedUserId, currentUserId, members]);

  const groupedEvents = useMemo(() => {
    const groups = {};
    for (const event of roster.events) {
      if (!groups[event.event_date]) groups[event.event_date] = [];
      groups[event.event_date].push(event);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [roster.events]);

  return (
    <div className="rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="px-4 py-3 border-b border-surface-100 bg-surface-50/50">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-surface-900 truncate">{roster.title}</h2>
          <Badge
            color={roster.status === 'published' ? 'success' : 'warning'}
            size="sm"
          >
            {roster.status === 'published' ? 'Published' : 'Draft'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-surface-500 mt-0.5">
          <span>{roster.team_name}</span>
          <span className="text-surface-300">|</span>
          <span>{formatDate(roster.start_date, 'MMM d')} – {formatDate(roster.end_date, 'MMM d, yyyy')}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Member selector (admin only) */}
        {isAdmin && members.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setMemberDropdownOpen(!memberDropdownOpen)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-surface-200 bg-surface-50 hover:border-surface-300 transition-colors cursor-pointer text-left"
            >
              <Users size={15} className="text-surface-400 shrink-0" />
              <span className="flex-1 text-sm font-medium text-surface-700 truncate">
                Marking for: <strong className="text-surface-900">{selectedMemberName}</strong>
              </span>
              <ChevronDown size={14} className={clsx('text-surface-400 transition-transform', memberDropdownOpen && 'rotate-180')} />
            </button>

            {memberDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMemberDropdownOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white rounded-xl border border-surface-200 shadow-lg max-h-60 overflow-y-auto">
                  {/* Self option */}
                  <button
                    onClick={() => { onSelectMember(currentUserId); setMemberDropdownOpen(false); }}
                    className={clsx(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors cursor-pointer',
                      selectedUserId === currentUserId ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-surface-700 hover:bg-surface-50'
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-bold text-primary-600 shrink-0">
                      You
                    </div>
                    <span>Yourself</span>
                    {selectedUserId === currentUserId && <CheckCircle2 size={14} className="ml-auto text-primary-500" />}
                  </button>

                  <div className="border-t border-surface-100" />

                  {/* Team members */}
                  {members.filter((m) => m.user_id !== currentUserId).map((m) => (
                    <button
                      key={m.user_id}
                      onClick={() => { onSelectMember(m.user_id); setMemberDropdownOpen(false); }}
                      className={clsx(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors cursor-pointer',
                        selectedUserId === m.user_id ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-surface-700 hover:bg-surface-50'
                      )}
                    >
                      <Avatar name={m.name} size="xs" />
                      <span className="truncate">{m.name}</span>
                      {selectedUserId === m.user_id && <CheckCircle2 size={14} className="ml-auto text-primary-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Summary bar */}
        <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl border border-surface-200">
          <div className="flex-1">
            <p className="text-sm font-medium text-surface-700">
              Available for <strong className="text-primary-600">{availableCount}</strong> of {totalSessions} sessions
            </p>
            <div className="w-full h-2 bg-surface-200 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: totalSessions > 0 ? `${(availableCount / totalSessions) * 100}%` : '0%' }}
              />
            </div>
          </div>
          {availableCount < totalSessions && (
            <button
              onClick={onMarkAll}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap cursor-pointer"
            >
              Mark all
            </button>
          )}
        </div>

        {/* Event groups */}
        <div className="space-y-4">
          {groupedEvents.map(([date, dateEvents]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-surface-400" />
                <span className="text-sm font-semibold text-surface-700">
                  {formatDate(date, 'EEEE, MMM d')}
                </span>
              </div>

              <div className="space-y-1.5">
                {dateEvents.map((event) => {
                  const session = getSessionFromTime(event.event_time);
                  const key = `${event.event_date}::${session}`;
                  const isAvailable = availability[key] ?? true;

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onToggle(key)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer text-left',
                        isAvailable
                          ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                          : 'bg-surface-50 border-surface-200 hover:border-surface-300'
                      )}
                    >
                      <div
                        className={clsx(
                          'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                          isAvailable
                            ? 'bg-emerald-500 text-white'
                            : 'bg-surface-200 text-surface-400'
                        )}
                      >
                        {isAvailable && <CheckCircle2 size={16} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={clsx(
                          'text-sm font-medium',
                          isAvailable ? 'text-surface-800' : 'text-surface-500'
                        )}>
                          {event.event_name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-surface-400 mt-0.5">
                          {event.event_time && (
                            <span className="inline-flex items-center gap-0.5">
                              <Clock size={10} />
                              {fmtTime(event.event_time)}
                            </span>
                          )}
                          <span className="text-surface-300">
                            {SESSION_LABELS[session] || session}
                          </span>
                        </div>
                      </div>

                      <span className={clsx(
                        'text-xs font-medium shrink-0',
                        isAvailable ? 'text-emerald-600' : 'text-surface-400'
                      )}>
                        {isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Save button */}
        <Button
          variant="primary"
          fullWidth
          iconLeft={Save}
          loading={saving}
          onClick={onSave}
        >
          Save Availability{isAdmin && selectedUserId !== currentUserId ? ` for ${selectedMemberName}` : ''}
        </Button>
      </div>
    </div>
  );
}
