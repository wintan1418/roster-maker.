import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSunday,
  isToday,
  getDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import {
  CalendarDays,
  Users,
  User,
  Send,
  Sun,
  CalendarOff,
  Check,
  Info,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import AvailabilityCalendar from './AvailabilityCalendar';
import useAuthStore from '@/stores/authStore';
import useTeamStore from '@/stores/teamStore';
import { supabase } from '@/lib/supabase';

// ── Component ────────────────────────────────────────────────────────────────

export default function AvailabilityEditor() {
  const { user, profile, orgId } = useAuthStore();
  const { teams, members, fetchTeams, fetchTeamMembers } = useTeamStore();

  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [viewMode, setViewMode] = useState('my');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // My availability: { dateKey: { available, reason } }
  const [myAvailability, setMyAvailability] = useState({});
  // Team availability: { userId: { dateKey: { available, reason } } }
  const [teamAvailability, setTeamAvailability] = useState({});

  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState(null);
  const [reasonText, setReasonText] = useState('');

  // Load teams when org is ready
  useEffect(() => {
    if (orgId) {
      fetchTeams(orgId).then(({ data }) => {
        if (data?.length > 0 && !selectedTeamId) {
          setSelectedTeamId(data[0].id);
        }
      });
    }
  }, [orgId, fetchTeams]);

  // Load members + availability when team or month changes
  useEffect(() => {
    if (!selectedTeamId || !user?.id) return;
    let cancelled = false;

    async function loadData() {
      setLoadingData(true);
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const [, availResult] = await Promise.all([
        fetchTeamMembers(selectedTeamId),
        supabase
          ? supabase
              .from('availability')
              .select('user_id, date, is_available, reason')
              .eq('team_id', selectedTeamId)
              .gte('date', monthStart)
              .lte('date', monthEnd)
          : { data: [], error: null },
      ]);

      if (cancelled) return;

      const rows = availResult?.data ?? [];

      // Build myAvailability
      const mine = {};
      // Build teamAvailability
      const team = {};
      for (const row of rows) {
        const entry = { available: row.is_available, reason: row.reason || '' };
        if (!team[row.user_id]) team[row.user_id] = {};
        team[row.user_id][row.date] = entry;
        if (row.user_id === user.id) {
          mine[row.date] = entry;
        }
      }

      setMyAvailability(mine);
      setTeamAvailability(team);
      setLoadingData(false);
    }

    loadData();
    return () => { cancelled = true; };
  }, [selectedTeamId, currentMonth, user?.id, fetchTeamMembers]);

  // ── My Availability actions ──────────────────────────────────────────────

  const getAvailabilityForDate = useCallback(
    (date) => {
      const key = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
      return myAvailability[key] ?? null;
    },
    [myAvailability]
  );

  const setAvailabilityLocal = useCallback((date, isAvailable, reason = '') => {
    const key = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    setMyAvailability((prev) => ({
      ...prev,
      [key]: { available: isAvailable, reason: isAvailable ? '' : reason },
    }));
  }, []);

  const handleDateClick = useCallback(
    (date) => {
      const current = getAvailabilityForDate(date);
      const isCurrentlyAvailable = current ? current.available : true;

      if (isCurrentlyAvailable) {
        setPendingDate(date);
        setReasonText('');
        setReasonModalOpen(true);
      } else {
        setAvailabilityLocal(date, true);
      }
    },
    [getAvailabilityForDate, setAvailabilityLocal]
  );

  const handleReasonConfirm = useCallback(() => {
    if (pendingDate) setAvailabilityLocal(pendingDate, false, reasonText);
    setReasonModalOpen(false);
    setPendingDate(null);
    setReasonText('');
  }, [pendingDate, reasonText, setAvailabilityLocal]);

  const handleReasonSkip = useCallback(() => {
    if (pendingDate) setAvailabilityLocal(pendingDate, false, '');
    setReasonModalOpen(false);
    setPendingDate(null);
    setReasonText('');
  }, [pendingDate, setAvailabilityLocal]);

  const handleMarkSundaysAvailable = useCallback(() => {
    const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
    days.forEach((day) => {
      if (isSunday(day)) setAvailabilityLocal(day, true);
    });
    toast.success('All Sundays marked as available');
  }, [currentMonth, setAvailabilityLocal]);

  const handleMarkWeekUnavailable = useCallback(() => {
    const now = new Date();
    const days = eachDayOfInterval({
      start: startOfWeek(now, { weekStartsOn: 0 }),
      end: endOfWeek(now, { weekStartsOn: 0 }),
    });
    days.forEach((day) => setAvailabilityLocal(day, false, 'Unavailable this week'));
    toast.success('Current week marked as unavailable');
  }, [setAvailabilityLocal]);

  // Submit: upsert all entries to Supabase
  const handleSubmit = useCallback(async () => {
    if (!supabase || !user?.id || !selectedTeamId) {
      toast.error('Not connected');
      return;
    }
    setSubmitting(true);
    try {
      const rows = Object.entries(myAvailability).map(([date, entry]) => ({
        user_id: user.id,
        team_id: selectedTeamId,
        date,
        is_available: entry.available,
        reason: entry.reason || null,
      }));

      if (rows.length === 0) {
        toast('No changes to save', { icon: 'ℹ️' });
        return;
      }

      const { error } = await supabase
        .from('availability')
        .upsert(rows, { onConflict: 'user_id,team_id,date' });

      if (error) throw error;
      toast.success('Availability saved successfully');
    } catch (err) {
      console.error('Failed to save availability:', err);
      toast.error('Failed to save availability');
    } finally {
      setSubmitting(false);
    }
  }, [myAvailability, user?.id, selectedTeamId]);

  // ── Derived stats ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const entries = Object.values(myAvailability);
    return {
      available: entries.filter((e) => e.available).length,
      unavailable: entries.filter((e) => !e.available).length,
    };
  }, [myAvailability]);

  const overviewDates = useMemo(() => {
    return eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  }, [currentMonth]);

  const teamMembers = useMemo(() => members, [members]);

  const selectedTeamName = useMemo(
    () => teams.find((t) => t.id === selectedTeamId)?.name || '',
    [teams, selectedTeamId]
  );

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight flex items-center gap-2.5">
            <CalendarDays size={24} className="text-surface-400" />
            Availability
          </h1>
          <p className="mt-1 text-surface-500">
            Manage your schedule and view team availability
          </p>
        </div>

        <div className="flex items-center gap-2">
          {teams.length > 0 && (
            <Select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              icon={Users}
              wrapperClassName="w-48"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      {/* ── View Toggle ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-surface-100 rounded-lg w-fit">
        <button
          onClick={() => setViewMode('my')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer',
            viewMode === 'my'
              ? 'bg-white text-surface-900 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'
          )}
        >
          <User size={16} />
          My Availability
        </button>
        <button
          onClick={() => setViewMode('team')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer',
            viewMode === 'team'
              ? 'bg-white text-surface-900 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'
          )}
        >
          <Users size={16} />
          Team Overview
        </button>
      </div>

      {loadingData && (
        <div className="flex items-center gap-2 text-surface-400 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading availability...
        </div>
      )}

      {/* ── My Availability View ────────────────────────────────────────── */}
      {viewMode === 'my' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <AvailabilityCalendar
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                onDateClick={handleDateClick}
                getAvailability={(date) => getAvailabilityForDate(date)}
                memberName={profile?.full_name || user?.email || 'Me'}
              />
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <h3 className="text-sm font-semibold text-surface-900 mb-3">This Month</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-sm text-surface-600">Available</span>
                  </div>
                  <span className="text-sm font-semibold text-surface-900">{stats.available} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-sm text-surface-600">Unavailable</span>
                  </div>
                  <span className="text-sm font-semibold text-surface-900">{stats.unavailable} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-surface-300" />
                    <span className="text-sm text-surface-600">Not set</span>
                  </div>
                  <span className="text-sm font-semibold text-surface-900">
                    {Math.max(0, overviewDates.length - stats.available - stats.unavailable)} days
                  </span>
                </div>
              </div>

              {(stats.available + stats.unavailable) > 0 && (
                <div className="mt-4">
                  <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 transition-all duration-300"
                      style={{ width: `${(stats.available / overviewDates.length) * 100}%` }}
                    />
                    <div
                      className="bg-red-500 transition-all duration-300"
                      style={{ width: `${(stats.unavailable / overviewDates.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-surface-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" fullWidth iconLeft={Sun} onClick={handleMarkSundaysAvailable}>
                  Mark all Sundays available
                </Button>
                <Button variant="outline" size="sm" fullWidth iconLeft={CalendarOff} onClick={handleMarkWeekUnavailable}>
                  Mark this week unavailable
                </Button>
              </div>
            </Card>

            <Button
              variant="primary"
              fullWidth
              iconLeft={Send}
              loading={submitting}
              onClick={handleSubmit}
              size="lg"
            >
              Submit Availability
            </Button>

            <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Click on any date to toggle your availability. When marking yourself unavailable, you can optionally provide a reason.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Team Overview View ──────────────────────────────────────────── */}
      {viewMode === 'team' && (
        <Card noPadding>
          <div className="px-6 pt-6 pb-4 border-b border-surface-200 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-surface-900">
                Team Availability — {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <p className="text-sm text-surface-500 mt-0.5">
                {teamMembers.length} members in {selectedTeamName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonth(currentMonth))}>Prev</Button>
              <span className="text-sm font-medium text-surface-700 min-w-[120px] text-center">
                {format(currentMonth, 'MMM yyyy')}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonth(currentMonth))}>Next</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr>
                  <th className="sticky left-0 z-10 bg-surface-50 px-4 py-3 text-left font-semibold text-surface-500 uppercase tracking-wider min-w-[160px]">
                    Member
                  </th>
                  {overviewDates.map((date) => {
                    const dayOfWeek = getDay(date);
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    return (
                      <th
                        key={date.toISOString()}
                        className={clsx(
                          'px-1 py-2 text-center font-medium min-w-[2rem]',
                          isWeekend ? 'text-surface-400' : 'text-surface-500',
                          isToday(date) && 'bg-primary-50'
                        )}
                      >
                        <div className="leading-tight">
                          <div className="uppercase">{format(date, 'EEE').charAt(0)}</div>
                          <div className={clsx(isToday(date) && 'text-primary-600 font-bold')}>
                            {format(date, 'd')}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {teamMembers.map((member) => {
                  const memberAvail = teamAvailability[member.user_id] || teamAvailability[member.id] || {};
                  return (
                    <tr key={member.id} className="hover:bg-surface-50/50 transition-colors">
                      <td className="sticky left-0 z-10 bg-white px-4 py-2.5 border-r border-surface-100">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={member.name} size="sm" />
                          <span className="text-sm font-medium text-surface-800 truncate">{member.name}</span>
                        </div>
                      </td>
                      {overviewDates.map((date) => {
                        const dateKey = format(date, 'yyyy-MM-dd');
                        const entry = memberAvail[dateKey];
                        const dayOfWeek = getDay(date);
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                        let cellBg = isWeekend ? 'bg-surface-50' : 'bg-white';
                        let dotColor = 'bg-surface-200';

                        if (entry) {
                          if (entry.available) {
                            dotColor = 'bg-emerald-400';
                            cellBg = 'bg-emerald-50/50';
                          } else {
                            dotColor = 'bg-red-400';
                            cellBg = 'bg-red-50/50';
                          }
                        }

                        return (
                          <td
                            key={date.toISOString()}
                            className={clsx('px-1 py-2.5 text-center', cellBg, isToday(date) && 'bg-primary-50/50')}
                            title={
                              entry
                                ? entry.available
                                  ? `${member.name}: Available`
                                  : `${member.name}: Unavailable${entry.reason ? ` - ${entry.reason}` : ''}`
                                : `${member.name}: Not set`
                            }
                          >
                            <span className={clsx('inline-block w-3 h-3 rounded-full', dotColor)} />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-surface-200 flex items-center gap-5">
            <span className="text-xs text-surface-500 font-medium">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-xs text-surface-500">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-xs text-surface-500">Unavailable</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-surface-200" />
              <span className="text-xs text-surface-500">Not set</span>
            </div>
          </div>
        </Card>
      )}

      {/* ── Reason Modal ────────────────────────────────────────────────── */}
      <Modal
        open={reasonModalOpen}
        onClose={() => { setReasonModalOpen(false); setPendingDate(null); setReasonText(''); }}
        title="Mark Unavailable"
        description={pendingDate ? `Marking ${format(pendingDate, 'EEEE, MMMM d, yyyy')} as unavailable` : ''}
        width="sm"
      >
        <div className="space-y-4">
          <Input
            label="Reason (optional)"
            placeholder="e.g., Family commitment, work schedule..."
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            helperText="This helps your team admins plan around your schedule"
          />
        </div>
        <Modal.Footer>
          <Button variant="ghost" onClick={handleReasonSkip}>Skip</Button>
          <Button variant="primary" iconLeft={Check} onClick={handleReasonConfirm}>Confirm</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function subMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function addMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}
