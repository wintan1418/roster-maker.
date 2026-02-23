import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Calendar,
  Send,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
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

export default function AvailabilityCheckPage() {
  const { token } = useParams();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [roster, setRoster] = useState(null);
  const [events, setEvents] = useState([]);
  // { "date::session": boolean } — true = available
  const [availability, setAvailability] = useState({});

  // Load data on mount
  useEffect(() => {
    if (!supabase || !token || !user?.id) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch roster by availability_token
        const { data: rosterData, error: rosterErr } = await supabase
          .from('rosters')
          .select(`
            id, title, team_id, start_date, end_date, status,
            teams(id, name)
          `)
          .eq('availability_token', token)
          .single();

        if (rosterErr || !rosterData) {
          setError('This availability check link is invalid or has expired.');
          setLoading(false);
          return;
        }

        // 2. Fetch roster events
        const { data: eventRows } = await supabase
          .from('roster_events')
          .select('id, event_name, event_date, event_time, sort_order')
          .eq('roster_id', rosterData.id)
          .order('event_date')
          .order('sort_order');

        if (cancelled) return;

        const sortedEvents = (eventRows ?? []).sort(
          (a, b) =>
            a.event_date.localeCompare(b.event_date) ||
            (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );

        // 3. Fetch existing availability for this user + team + date range
        const { data: existingRows } = await supabase
          .from('availability')
          .select('date, session, is_available')
          .eq('user_id', user.id)
          .eq('team_id', rosterData.team_id)
          .gte('date', rosterData.start_date)
          .lte('date', rosterData.end_date);

        if (cancelled) return;

        // 4. Build lookup: "date::session" → is_available
        const existingMap = {};
        for (const row of existingRows ?? []) {
          existingMap[`${row.date}::${row.session}`] = row.is_available;
        }

        // 5. Build initial availability state per unique date+session
        const initialAvail = {};
        for (const event of sortedEvents) {
          const session = getSessionFromTime(event.event_time);
          const key = `${event.event_date}::${session}`;
          if (key in initialAvail) continue; // already set by first event with this key
          // Default to true (available) unless explicitly marked false
          initialAvail[key] = existingMap[key] !== false;
        }

        setRoster({ ...rosterData, team_name: rosterData.teams?.name || '' });
        setEvents(sortedEvents);
        setAvailability(initialAvail);
      } catch (err) {
        console.error('Failed to load availability check:', err);
        setError('Something went wrong loading this page.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [token, user?.id]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups = {};
    for (const event of events) {
      if (!groups[event.event_date]) groups[event.event_date] = [];
      groups[event.event_date].push(event);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  // Unique date+session pairs count
  const totalSessions = Object.keys(availability).length;
  const availableCount = Object.values(availability).filter(Boolean).length;

  const handleToggle = useCallback((dateSessionKey) => {
    setAvailability((prev) => ({ ...prev, [dateSessionKey]: !prev[dateSessionKey] }));
  }, []);

  const handleMarkAllAvailable = useCallback(() => {
    setAvailability((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) next[key] = true;
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!supabase || !user?.id || !roster?.team_id) return;
    setSubmitting(true);

    try {
      const rows = Object.entries(availability).map(([key, isAvailable]) => {
        const [date, session] = key.split('::');
        return {
          user_id: user.id,
          team_id: roster.team_id,
          date,
          session,
          is_available: isAvailable,
          reason: isAvailable ? null : 'Marked via availability check',
        };
      });

      const { error: upsertErr } = await supabase
        .from('availability')
        .upsert(rows, { onConflict: 'user_id,team_id,date,session' });

      if (upsertErr) throw upsertErr;
      setSubmitted(true);
      toast.success('Availability saved!');
    } catch (err) {
      console.error('Failed to save availability:', err);
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  }, [availability, user?.id, roster?.team_id]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={32} className="animate-spin text-primary-500" />
        <span className="text-surface-500">Loading availability check...</span>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 max-w-md mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-surface-900">Unavailable</h1>
        <p className="text-surface-500">{error}</p>
      </div>
    );
  }

  // ── Success state ──
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-surface-900">Availability Submitted!</h1>
        <p className="text-surface-500">
          You&apos;re available for <strong className="text-surface-800">{availableCount} of {totalSessions}</strong> sessions.
        </p>
        <p className="text-xs text-surface-400">
          Your team admin will see your responses in the roster editor.
        </p>
        <Button
          variant="outline"
          onClick={() => setSubmitted(false)}
          className="mt-2"
        >
          Edit Response
        </Button>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 mb-3">
          <CalendarCheck size={24} className="text-primary-600" />
        </div>
        <h1 className="text-xl font-bold text-surface-900">Availability Check</h1>
        <p className="text-base font-semibold text-surface-700 mt-1">{roster.title}</p>
        <div className="flex items-center justify-center gap-2 text-sm text-surface-500 mt-1">
          <span>{roster.team_name}</span>
          <span className="text-surface-300">|</span>
          <span>{formatDate(roster.start_date, 'MMM d')} – {formatDate(roster.end_date, 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl border border-surface-200 mb-6">
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
            onClick={handleMarkAllAvailable}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap cursor-pointer"
          >
            Mark all
          </button>
        )}
      </div>

      {/* Event groups */}
      <div className="space-y-4 mb-6">
        {groupedEvents.map(([date, dateEvents]) => (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-surface-400" />
              <span className="text-sm font-semibold text-surface-700">
                {formatDate(date, 'EEEE, MMM d')}
              </span>
            </div>

            {/* Events for this date */}
            <div className="space-y-1.5">
              {dateEvents.map((event) => {
                const session = getSessionFromTime(event.event_time);
                const key = `${event.event_date}::${session}`;
                const isAvailable = availability[key] ?? true;

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => handleToggle(key)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer text-left',
                      isAvailable
                        ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                        : 'bg-surface-50 border-surface-200 hover:border-surface-300'
                    )}
                  >
                    {/* Toggle indicator */}
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

                    {/* Event info */}
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

                    {/* Status text */}
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

      {/* Submit */}
      <Button
        variant="primary"
        fullWidth
        size="lg"
        iconLeft={Send}
        loading={submitting}
        onClick={handleSubmit}
      >
        Submit Availability
      </Button>

      <p className="text-xs text-surface-400 text-center mt-3">
        Your responses will be visible to your team admin when building the roster.
      </p>
    </div>
  );
}
