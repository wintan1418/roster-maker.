import { useState, useMemo, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  getDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * AvailabilityCalendar - A monthly calendar grid showing availability status.
 *
 * @param {Object}   props
 * @param {Date}     props.currentMonth       - The currently displayed month
 * @param {Function} props.onMonthChange      - Callback when navigating months
 * @param {Function} props.onDateClick        - Callback when clicking a day cell
 * @param {Function} props.getAvailability    - (date) => { available: boolean, reason: string } | null
 * @param {string}   props.memberName         - Optional member name to display at top
 * @param {boolean}  props.readOnly           - If true, clicking days does nothing
 * @param {string}   props.className          - Additional CSS classes
 */
export default function AvailabilityCalendar({
  currentMonth,
  onMonthChange,
  onDateClick,
  getAvailability,
  memberName,
  readOnly = false,
  className,
}) {
  const [hoveredDate, setHoveredDate] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Build the full grid: start from the Sunday of the week containing the 1st
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart.getTime(), calendarEnd.getTime()]
  );

  const handlePrevMonth = useCallback(() => {
    onMonthChange?.(subMonths(currentMonth, 1));
  }, [currentMonth, onMonthChange]);

  const handleNextMonth = useCallback(() => {
    onMonthChange?.(addMonths(currentMonth, 1));
  }, [currentMonth, onMonthChange]);

  const handleDateClick = useCallback(
    (day) => {
      if (readOnly) return;
      onDateClick?.(day);
    },
    [readOnly, onDateClick]
  );

  return (
    <div className={clsx('select-none', className)}>
      {/* Member display */}
      {memberName && (
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={memberName} size="md" />
          <div>
            <p className="text-sm font-semibold text-surface-900">{memberName}</p>
            <p className="text-xs text-surface-500">Availability Calendar</p>
          </div>
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          iconLeft={ChevronLeft}
          onClick={handlePrevMonth}
          aria-label="Previous month"
        />
        <h3 className="text-base font-semibold text-surface-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          iconLeft={ChevronRight}
          onClick={handleNextMonth}
          aria-label="Next month"
        />
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className={clsx(
              'text-center text-xs font-semibold py-2 text-surface-500 uppercase tracking-wider',
              (day === 'Sun' || day === 'Sat') && 'text-surface-400'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-surface-200 rounded-lg overflow-hidden border border-surface-200">
        {calendarDays.map((day) => {
          const inCurrentMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const dayOfWeek = getDay(day);
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const availability = getAvailability ? getAvailability(day) : null;
          const isHovered = hoveredDate && isSameDay(day, hoveredDate);

          let statusBg = 'bg-white'; // not set
          let statusRing = '';

          if (inCurrentMonth && availability) {
            if (availability.available) {
              statusBg = 'bg-emerald-50';
            } else {
              statusBg = 'bg-red-50';
            }
          } else if (isWeekend && inCurrentMonth) {
            statusBg = 'bg-surface-50';
          } else if (!inCurrentMonth) {
            statusBg = 'bg-surface-50/60';
          }

          if (today) {
            statusRing = 'ring-2 ring-inset ring-primary-400';
          }

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleDateClick(day)}
              onMouseEnter={() => setHoveredDate(day)}
              onMouseLeave={() => setHoveredDate(null)}
              disabled={readOnly && !inCurrentMonth}
              className={clsx(
                'relative flex flex-col items-center justify-start py-2 px-1 min-h-[3.5rem] transition-all duration-150',
                statusBg,
                statusRing,
                !readOnly && inCurrentMonth && 'cursor-pointer hover:bg-primary-50',
                !inCurrentMonth && 'cursor-default',
                isHovered && !readOnly && inCurrentMonth && 'bg-primary-50'
              )}
            >
              <span
                className={clsx(
                  'text-sm leading-none',
                  today && 'font-bold text-primary-600',
                  !today && inCurrentMonth && 'font-medium text-surface-700',
                  !inCurrentMonth && 'text-surface-300'
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Status indicator dot */}
              {inCurrentMonth && availability && (
                <span
                  className={clsx(
                    'mt-1.5 w-2 h-2 rounded-full transition-transform duration-150',
                    availability.available ? 'bg-emerald-500' : 'bg-red-500',
                    isHovered && 'scale-125'
                  )}
                />
              )}

              {/* Tooltip for reason */}
              {isHovered &&
                inCurrentMonth &&
                availability &&
                !availability.available &&
                availability.reason && (
                  <div className="absolute z-10 bottom-full mb-1 left-1/2 -translate-x-1/2 bg-surface-900 text-white text-xs px-2.5 py-1.5 rounded-md whitespace-nowrap shadow-lg pointer-events-none">
                    {availability.reason}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-surface-900" />
                  </div>
                )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-4 pt-3 border-t border-surface-100">
        <LegendItem color="bg-emerald-500" label="Available" />
        <LegendItem color="bg-red-500" label="Unavailable" />
        <LegendItem color="bg-surface-300" label="Not set" />
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm ring-2 ring-primary-400 bg-white" />
          <span className="text-xs text-surface-500">Today</span>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={clsx('w-2.5 h-2.5 rounded-full', color)} />
      <span className="text-xs text-surface-500">{label}</span>
    </div>
  );
}
