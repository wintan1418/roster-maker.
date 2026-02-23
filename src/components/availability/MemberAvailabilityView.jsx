import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Loader2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Calendar,
  Save,
  Inbox,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import useAuthStore from '@/stores/authStore';
import { formatDate, getSessionFromTime } from '@/lib/utils';

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
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [rosters, setRosters] = useState([]);
  // { rosterId: { "date::session": boolean } }
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [savingRoster, setSavingRoster] = useState(null);

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

        // 2. Get active rosters for those teams (draft or published, not past)
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

        // 4. Fetch existing availability
        const { data: availRows } = await supabase
          .from('availability')
          .select('date, session, is_available, team_id')
          .eq('user_id', user.id)
          .in('team_id', teamIds);

        if (cancelled) return;

        // Build existing availability lookup: "teamId::date::session" → is_available
        const existingLookup = {};
        for (const row of availRows ?? []) {
          existingLookup[`${row.team_id}::${row.date}::${row.session}`] = row.is_available;
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

        // Build enriched rosters and per-roster availability maps
        const enrichedRosters = [];
        const availMap = {};

        for (const r of rosterRows) {
          const rEvents = (eventsByRoster[r.id] ?? []).sort(
            (a, b) => a.event_date.localeCompare(b.event_date) || (a.sort_order ?? 0) - (b.sort_order ?? 0)
          );
          if (rEvents.length === 0) continue; // skip rosters with no events

          // Build initial availability for this roster
          const rosterAvail = {};
          for (const event of rEvents) {
            const session = getSessionFromTime(event.event_time);
            const key = `${event.event_date}::${session}`;
            if (key in rosterAvail) continue;
            const lookupKey = `${r.team_id}::${event.event_date}::${session}`;
            rosterAvail[key] = existingLookup[lookupKey] !== false;
          }

          enrichedRosters.push({
            ...r,
            team_name: teamNameMap[r.team_id] || '',
            events: rEvents,
          });
          availMap[r.id] = rosterAvail;
        }

        if (!cancelled) {
          setRosters(enrichedRosters);
          setAvailabilityMap(availMap);
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
  }, [user?.id]);

  const handleToggle = useCallback((rosterId, dateSessionKey) => {
    setAvailabilityMap((prev) => ({
      ...prev,
      [rosterId]: {
        ...prev[rosterId],
        [dateSessionKey]: !prev[rosterId]?.[dateSessionKey],
      },
    }));
  }, []);

  const handleMarkAll = useCallback((rosterId) => {
    setAvailabilityMap((prev) => {
      const rosterAvail = { ...prev[rosterId] };
      for (const key of Object.keys(rosterAvail)) rosterAvail[key] = true;
      return { ...prev, [rosterId]: rosterAvail };
    });
  }, []);

  const handleSave = useCallback(async (rosterId) => {
    const roster = rosters.find((r) => r.id === rosterId);
    const avail = availabilityMap[rosterId];
    if (!roster || !avail || !supabase || !user?.id) return;

    setSavingRoster(rosterId);
    try {
      const rows = Object.entries(avail).map(([key, isAvailable]) => {
        const [date, session] = key.split('::');
        return {
          user_id: user.id,
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
      toast.success(`Availability saved for ${roster.title}!`);
    } catch (err) {
      console.error('Failed to save availability:', err);
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingRoster(null);
    }
  }, [rosters, availabilityMap, user?.id]);

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
          When your team admin creates a roster, it will appear here for you to mark your availability.
        </p>
      </div>
    );
  }

  // ── Roster cards ──
  return (
    <div className="max-w-lg mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <CalendarCheck size={22} className="text-primary-500" />
          Availability
        </h1>
        <p className="text-sm text-surface-500 mt-1">
          Mark your availability for upcoming rosters
        </p>
      </div>

      {rosters.map((roster) => (
        <RosterCard
          key={roster.id}
          roster={roster}
          availability={availabilityMap[roster.id] || {}}
          saving={savingRoster === roster.id}
          onToggle={(key) => handleToggle(roster.id, key)}
          onMarkAll={() => handleMarkAll(roster.id)}
          onSave={() => handleSave(roster.id)}
        />
      ))}
    </div>
  );
}

// ── Per-roster checklist card ────────────────────────────────────────────────

function RosterCard({ roster, availability, saving, onToggle, onMarkAll, onSave }) {
  const totalSessions = Object.keys(availability).length;
  const availableCount = Object.values(availability).filter(Boolean).length;

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
          Save Availability
        </Button>
      </div>
    </div>
  );
}
