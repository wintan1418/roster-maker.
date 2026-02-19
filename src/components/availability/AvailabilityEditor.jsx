import { useState, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import AvailabilityCalendar from './AvailabilityCalendar';
import useAvailability from '@/hooks/useAvailability';

// ── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_TEAMS = [
  { id: 'team-1', name: 'Music Ministry' },
  { id: 'team-2', name: 'Sound & Tech' },
  { id: 'team-3', name: 'Church Events' },
  { id: 'team-4', name: 'Youth Ministry' },
];

const DEMO_MEMBERS = [
  { id: 'user-1', name: 'Sarah Mitchell', teamId: 'team-1' },
  { id: 'user-2', name: 'John Doe', teamId: 'team-1' },
  { id: 'user-3', name: 'Lisa Park', teamId: 'team-1' },
  { id: 'user-4', name: 'Michael Chen', teamId: 'team-1' },
  { id: 'user-5', name: 'Grace Kim', teamId: 'team-1' },
  { id: 'user-6', name: 'David Lee', teamId: 'team-2' },
  { id: 'user-7', name: 'Emma Watson', teamId: 'team-2' },
  { id: 'user-8', name: 'James Taylor', teamId: 'team-2' },
  { id: 'user-9', name: 'Rachel Adams', teamId: 'team-3' },
  { id: 'user-10', name: 'Thomas Brown', teamId: 'team-3' },
];

const CURRENT_USER_ID = 'user-1';

// Generate some realistic initial availability data
function generateDemoAvailability() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const data = {};

  DEMO_MEMBERS.forEach((member) => {
    const memberData = {};
    days.forEach((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      // Randomize: ~75% available, ~15% unavailable, ~10% not set
      const rand = Math.random();
      if (rand < 0.75) {
        memberData[dateKey] = { available: true, reason: '' };
      } else if (rand < 0.90) {
        const reasons = [
          'Family commitment',
          'Out of town',
          'Work schedule',
          'Medical appointment',
          'Prior engagement',
          '',
        ];
        memberData[dateKey] = {
          available: false,
          reason: reasons[Math.floor(Math.random() * reasons.length)],
        };
      }
      // else: not set (leave undefined)
    });
    data[member.id] = memberData;
  });

  return data;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AvailabilityEditor() {
  const [selectedTeam, setSelectedTeam] = useState(DEMO_TEAMS[0].id);
  const [viewMode, setViewMode] = useState('my'); // 'my' or 'team'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState(null);
  const [reasonText, setReasonText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const initialData = useMemo(() => generateDemoAvailability(), []);

  const {
    toggleAvailability,
    setAvailability,
    setAvailabilityRange,
    getAvailabilityForDate,
    getUserAvailability,
    stats,
  } = useAvailability(CURRENT_USER_ID, initialData);

  const teamMembers = useMemo(
    () => DEMO_MEMBERS.filter((m) => m.teamId === selectedTeam),
    [selectedTeam]
  );

  // Handle date click on calendar: if marking unavailable, show reason modal
  const handleDateClick = useCallback(
    (date) => {
      const current = getAvailabilityForDate(date);
      const isCurrentlyAvailable = current ? current.available : true;

      if (isCurrentlyAvailable) {
        // About to mark unavailable -- ask for reason
        setPendingDate(date);
        setReasonText('');
        setReasonModalOpen(true);
      } else {
        // Mark available -- no reason needed
        toggleAvailability(date);
      }
    },
    [getAvailabilityForDate, toggleAvailability]
  );

  const handleReasonConfirm = useCallback(() => {
    if (pendingDate) {
      setAvailability(pendingDate, false, reasonText);
    }
    setReasonModalOpen(false);
    setPendingDate(null);
    setReasonText('');
  }, [pendingDate, reasonText, setAvailability]);

  const handleReasonSkip = useCallback(() => {
    if (pendingDate) {
      setAvailability(pendingDate, false, '');
    }
    setReasonModalOpen(false);
    setPendingDate(null);
    setReasonText('');
  }, [pendingDate, setAvailability]);

  // Quick actions
  const handleMarkSundaysAvailable = useCallback(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    days.forEach((day) => {
      if (isSunday(day)) {
        setAvailability(day, true);
      }
    });

    toast.success('All Sundays marked as available');
  }, [currentMonth, setAvailability]);

  const handleMarkWeekUnavailable = useCallback(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    setAvailabilityRange(weekStart, weekEnd, false, 'Unavailable this week');
    toast.success('Current week marked as unavailable');
  }, [setAvailabilityRange]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitting(false);
    toast.success('Availability submitted successfully');
  }, []);

  // For team overview: build the dates for the visible portion of the month
  const overviewDates = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

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
          <Select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            icon={Users}
            wrapperClassName="w-48"
          >
            {DEMO_TEAMS.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
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

      {/* ── My Availability View ────────────────────────────────────────── */}
      {viewMode === 'my' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar (main area) */}
          <div className="lg:col-span-2">
            <Card>
              <AvailabilityCalendar
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                onDateClick={handleDateClick}
                getAvailability={(date) => getAvailabilityForDate(date)}
                memberName="Sarah Mitchell"
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Stats */}
            <Card>
              <h3 className="text-sm font-semibold text-surface-900 mb-3">
                This Month
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-sm text-surface-600">Available</span>
                  </div>
                  <span className="text-sm font-semibold text-surface-900">
                    {stats.available} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-sm text-surface-600">Unavailable</span>
                  </div>
                  <span className="text-sm font-semibold text-surface-900">
                    {stats.unavailable} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-surface-300" />
                    <span className="text-sm text-surface-600">Not set</span>
                  </div>
                  <span className="text-sm font-semibold text-surface-900">
                    {Math.max(0, overviewDates.length - stats.total)} days
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              {stats.total > 0 && (
                <div className="mt-4">
                  <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 transition-all duration-300"
                      style={{
                        width: `${(stats.available / overviewDates.length) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-red-500 transition-all duration-300"
                      style={{
                        width: `${(stats.unavailable / overviewDates.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card>
              <h3 className="text-sm font-semibold text-surface-900 mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  iconLeft={Sun}
                  onClick={handleMarkSundaysAvailable}
                >
                  Mark all Sundays available
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  iconLeft={CalendarOff}
                  onClick={handleMarkWeekUnavailable}
                >
                  Mark this week unavailable
                </Button>
              </div>
            </Card>

            {/* Submit */}
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

            {/* Info note */}
            <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Click on any date to toggle your availability. When marking
                yourself unavailable, you can optionally provide a reason for
                your team admins.
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
                Team Availability - {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <p className="text-sm text-surface-500 mt-0.5">
                {teamMembers.length} members in{' '}
                {DEMO_TEAMS.find((t) => t.id === selectedTeam)?.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(subMonthsHelper(currentMonth))}
              >
                Prev
              </Button>
              <span className="text-sm font-medium text-surface-700 min-w-[120px] text-center">
                {format(currentMonth, 'MMM yyyy')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(addMonthsHelper(currentMonth))}
              >
                Next
              </Button>
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
                  const memberAvailability = getUserAvailability(member.id);
                  return (
                    <tr key={member.id} className="hover:bg-surface-50/50 transition-colors">
                      <td className="sticky left-0 z-10 bg-white px-4 py-2.5 border-r border-surface-100">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={member.name} size="sm" />
                          <span className="text-sm font-medium text-surface-800 truncate">
                            {member.name}
                          </span>
                        </div>
                      </td>
                      {overviewDates.map((date) => {
                        const dateKey = format(date, 'yyyy-MM-dd');
                        const entry = memberAvailability[dateKey];
                        const dayOfWeek = getDay(date);
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                        let cellBg = isWeekend ? 'bg-surface-50' : 'bg-white';
                        let dotColor = 'bg-surface-200'; // not set

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
                            className={clsx(
                              'px-1 py-2.5 text-center',
                              cellBg,
                              isToday(date) && 'bg-primary-50/50'
                            )}
                            title={
                              entry
                                ? entry.available
                                  ? `${member.name}: Available`
                                  : `${member.name}: Unavailable${entry.reason ? ` - ${entry.reason}` : ''}`
                                : `${member.name}: Not set`
                            }
                          >
                            <span
                              className={clsx(
                                'inline-block w-3 h-3 rounded-full',
                                dotColor
                              )}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
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
        onClose={() => {
          setReasonModalOpen(false);
          setPendingDate(null);
          setReasonText('');
        }}
        title="Mark Unavailable"
        description={
          pendingDate
            ? `Marking ${format(pendingDate, 'EEEE, MMMM d, yyyy')} as unavailable`
            : ''
        }
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
          <Button variant="ghost" onClick={handleReasonSkip}>
            Skip
          </Button>
          <Button variant="primary" iconLeft={Check} onClick={handleReasonConfirm}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function subMonthsHelper(date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function addMonthsHelper(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}
