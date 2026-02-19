import { useMemo } from 'react';
import {
  ArrowLeft,
  Send,
  AlertTriangle,
  CheckCircle2,
  Users,
  CalendarDays,
} from 'lucide-react';
import clsx from 'clsx';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { formatDate } from '@/lib/utils';
import { getDemoMember, getDemoRolesForTeam } from '@/lib/demoData';

/**
 * RosterPreview - Read-only preview of the roster before publishing.
 * Clean table format matching a print/PDF layout.
 */
export default function RosterPreview({
  roster,
  events,
  assignments,
  onBack,
  onPublish,
}) {
  const roles = useMemo(
    () => getDemoRolesForTeam(roster.team_id),
    [roster.team_id]
  );

  // Calculate stats
  const stats = useMemo(() => {
    const totalCells = events.length * roles.length;
    const filledCells = Object.keys(assignments).length;
    const emptyCells = totalCells - filledCells;
    const manualCount = Object.values(assignments).filter((a) => a.manual).length;
    const autoCount = filledCells - manualCount;

    // Unique members assigned
    const uniqueMembers = new Set();
    for (const value of Object.values(assignments)) {
      if (value?.memberId) uniqueMembers.add(value.memberId);
    }

    return {
      totalEvents: events.length,
      totalCells,
      filledCells,
      emptyCells,
      manualCount,
      autoCount,
      uniqueMembers: uniqueMembers.size,
      fillPercentage: totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0,
    };
  }, [events, roles, assignments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-surface-900">{roster.title}</h2>
          <p className="text-sm text-surface-500 mt-1">
            {roster.team_name} &middot;{' '}
            {formatDate(roster.start_date, 'MMM d')} - {formatDate(roster.end_date, 'MMM d, yyyy')}
          </p>
        </div>
        <Badge color="info" size="md">
          Preview Mode
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-surface-50 border border-surface-200">
          <div className="flex items-center gap-2 text-surface-500 text-xs font-medium mb-1">
            <CalendarDays size={13} />
            Events
          </div>
          <p className="text-lg font-bold text-surface-900">{stats.totalEvents}</p>
        </div>
        <div className="p-3 rounded-lg bg-surface-50 border border-surface-200">
          <div className="flex items-center gap-2 text-surface-500 text-xs font-medium mb-1">
            <CheckCircle2 size={13} />
            Filled Slots
          </div>
          <p className="text-lg font-bold text-surface-900">
            {stats.filledCells}
            <span className="text-sm font-normal text-surface-400 ml-1">
              / {stats.totalCells}
            </span>
          </p>
        </div>
        <div className="p-3 rounded-lg bg-surface-50 border border-surface-200">
          <div className="flex items-center gap-2 text-surface-500 text-xs font-medium mb-1">
            <Users size={13} />
            Members
          </div>
          <p className="text-lg font-bold text-surface-900">{stats.uniqueMembers}</p>
        </div>
        <div
          className={clsx(
            'p-3 rounded-lg border',
            stats.emptyCells > 0
              ? 'bg-amber-50 border-amber-200'
              : 'bg-emerald-50 border-emerald-200'
          )}
        >
          <div
            className={clsx(
              'flex items-center gap-2 text-xs font-medium mb-1',
              stats.emptyCells > 0 ? 'text-amber-600' : 'text-emerald-600'
            )}
          >
            {stats.emptyCells > 0 ? (
              <AlertTriangle size={13} />
            ) : (
              <CheckCircle2 size={13} />
            )}
            {stats.emptyCells > 0 ? 'Empty Slots' : 'Complete'}
          </div>
          <p
            className={clsx(
              'text-lg font-bold',
              stats.emptyCells > 0 ? 'text-amber-700' : 'text-emerald-700'
            )}
          >
            {stats.emptyCells > 0 ? stats.emptyCells : `${stats.fillPercentage}%`}
          </p>
        </div>
      </div>

      {/* Warning if empty slots */}
      {stats.emptyCells > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {stats.emptyCells} slot{stats.emptyCells !== 1 ? 's' : ''} still empty
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Consider using the shuffle feature or manually assigning members before publishing.
            </p>
          </div>
        </div>
      )}

      {/* Preview table */}
      <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-surface-800 text-white">
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase min-w-[160px]">
                Date / Event
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  className="px-3 py-3 text-center text-xs font-semibold tracking-wide uppercase min-w-[140px]"
                >
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {events.map((event, index) => (
              <tr
                key={event.id}
                className={clsx(
                  index % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'
                )}
              >
                <td className="px-4 py-3 border-r border-surface-200">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-surface-900">
                      {event.name}
                    </span>
                    <span className="text-xs text-surface-500">
                      {formatDate(event.date, 'EEE, MMM d, yyyy')}
                    </span>
                    {event.time && (
                      <span className="text-xs text-surface-400">{event.time}</span>
                    )}
                  </div>
                </td>

                {roles.map((role) => {
                  const cellKey = `${event.id}-${role.id}`;
                  const assignment = assignments[cellKey];
                  const member = assignment?.memberId
                    ? getDemoMember(assignment.memberId)
                    : null;

                  return (
                    <td
                      key={role.id}
                      className={clsx(
                        'px-3 py-3 text-center',
                        member ? '' : 'text-surface-300'
                      )}
                    >
                      {member ? (
                        <div className="flex flex-col items-center gap-1">
                          <Avatar name={member.name} size="sm" />
                          <span className="text-xs font-medium text-surface-800">
                            {member.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs italic">--</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack} iconLeft={ArrowLeft}>
          Back to Editor
        </Button>

        <div className="flex items-center gap-3">
          <p className="text-sm text-surface-500 hidden sm:block">
            Looks good?
          </p>
          <Button variant="primary" onClick={onPublish} iconLeft={Send}>
            Publish Roster
          </Button>
        </div>
      </div>
    </div>
  );
}
