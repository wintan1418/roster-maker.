import { useState, useMemo, useCallback } from 'react';
import {
  Save,
  Eye,
  Send,
  Trash2,
  Calendar,
  Clock,
  Pin,
  Shuffle as ShuffleIcon,
  Info,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import ShuffleButton from '@/components/roster/ShuffleButton';
import RosterCell from '@/components/roster/RosterCell';
import useShuffle from '@/hooks/useShuffle';
import { formatDate } from '@/lib/utils';

/**
 * RosterGrid - The main roster grid editor.
 *
 * Rows = events (dates)
 * Columns = roles
 * Cells = assignments
 */
export default function RosterGrid({
  roster,
  events,
  roles = [],
  members = [],
  initialAssignments = {},
  onPreview,
  onPublish,
  onSave,
  readOnly = false,
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [hasChanges, setHasChanges] = useState(false);

  const { shuffle, clearAutoAssignments, isShuffling } = useShuffle();

  // Calculate assignment counts per member across the entire roster
  const assignmentCounts = useMemo(() => {
    const counts = {};
    for (const value of Object.values(assignments)) {
      if (value?.memberId) {
        counts[value.memberId] = (counts[value.memberId] || 0) + 1;
      }
    }
    return counts;
  }, [assignments]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalCells = events.length * roles.length;
    const filledCells = Object.keys(assignments).length;
    const manualCells = Object.values(assignments).filter((a) => a.manual).length;
    const autoCells = filledCells - manualCells;
    const emptyCells = totalCells - filledCells;
    return { totalCells, filledCells, manualCells, autoCells, emptyCells };
  }, [events, roles, assignments]);

  // Get set of members assigned to a specific event
  const getAssignedToEvent = useCallback(
    (eventId) => {
      const assigned = new Set();
      for (const [key, value] of Object.entries(assignments)) {
        if (key.startsWith(eventId + '-') && value?.memberId) {
          assigned.add(value.memberId);
        }
      }
      return assigned;
    },
    [assignments]
  );

  // Cell actions
  const handleAssign = useCallback((eventId, roleId, memberId) => {
    setAssignments((prev) => ({
      ...prev,
      [`${eventId}-${roleId}`]: { memberId, manual: true },
    }));
    setHasChanges(true);
  }, []);

  const handleRemove = useCallback((eventId, roleId) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[`${eventId}-${roleId}`];
      return next;
    });
    setHasChanges(true);
  }, []);

  const handleToggleManual = useCallback((eventId, roleId) => {
    setAssignments((prev) => {
      const key = `${eventId}-${roleId}`;
      if (!prev[key]) return prev;
      return {
        ...prev,
        [key]: { ...prev[key], manual: !prev[key].manual },
      };
    });
    setHasChanges(true);
  }, []);

  // Shuffle actions
  const handleShuffleAll = async () => {
    const { newAssignments, assignmentsMade } = await shuffle({
      events,
      roles,
      teamId: roster.team_id,
      currentAssignments: assignments,
      mode: 'all',
    });
    setAssignments(newAssignments);
    setHasChanges(true);
    toast.success(`Shuffled! ${assignmentsMade} assignment${assignmentsMade !== 1 ? 's' : ''} made.`, {
      icon: '🔀',
    });
  };

  const handleShuffleEmpty = async () => {
    const { newAssignments, assignmentsMade } = await shuffle({
      events,
      roles,
      teamId: roster.team_id,
      currentAssignments: assignments,
      mode: 'empty_only',
    });
    setAssignments(newAssignments);
    setHasChanges(true);
    toast.success(
      assignmentsMade > 0
        ? `Filled ${assignmentsMade} empty slot${assignmentsMade !== 1 ? 's' : ''}.`
        : 'All slots are already filled!',
      { icon: assignmentsMade > 0 ? '✨' : '✅' }
    );
  };

  const handleClearAuto = () => {
    const { newAssignments, removedCount } = clearAutoAssignments(assignments);
    setAssignments(newAssignments);
    setHasChanges(true);
    toast.success(`Cleared ${removedCount} auto-assignment${removedCount !== 1 ? 's' : ''}.`, {
      icon: '🗑️',
    });
  };

  const handleClearAll = () => {
    setAssignments({});
    setHasChanges(true);
    toast.success('All assignments cleared.');
  };

  const handleSave = () => {
    onSave?.(assignments);
    setHasChanges(false);
    toast.success('Roster saved successfully!');
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {!readOnly && (
            <>
              <ShuffleButton
                onShuffleAll={handleShuffleAll}
                onShuffleEmpty={handleShuffleEmpty}
                onClearAuto={handleClearAuto}
                isShuffling={isShuffling}
              />

              <Button
                variant="ghost"
                size="sm"
                iconLeft={Trash2}
                onClick={handleClearAll}
              >
                <span className="hidden sm:inline">Clear All</span>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              iconLeft={Save}
              onClick={handleSave}
              disabled={!hasChanges}
            >
              Save
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            iconLeft={Eye}
            onClick={() => onPreview?.(assignments)}
          >
            Preview
          </Button>
          {!readOnly && (
            <Button
              variant="primary"
              size="sm"
              iconLeft={Send}
              onClick={() => onPublish?.(assignments)}
            >
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-surface-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-sky-100 border border-sky-200" />
          Assigned: {stats.filledCells}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-50 border border-amber-200" />
          Empty: {stats.emptyCells}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Pin size={10} className="text-amber-500" />
          Pinned: {stats.manualCells}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShuffleIcon size={10} className="text-primary-500" />
          Auto: {stats.autoCells}
        </span>
      </div>

      {/* Shuffling overlay */}
      {isShuffling && (
        <div className="flex items-center justify-center py-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100">
            <ShuffleIcon size={16} className="text-primary-500 animate-spin" />
            <span className="text-sm font-medium text-primary-700">
              Shuffling assignments...
            </span>
          </div>
        </div>
      )}

      {/* Grid table */}
      <div className="relative overflow-x-auto rounded-xl border border-surface-200 bg-white shadow-sm">
        <table className="w-full text-sm border-collapse">
          {/* Header row (sticky) */}
          <thead>
            <tr className="bg-surface-50">
              {/* Sticky first column: Event */}
              <th
                className={clsx(
                  'sticky left-0 z-20 bg-surface-50',
                  'px-4 py-3 text-left text-xs font-semibold tracking-wide text-surface-500 uppercase',
                  'border-b border-r border-surface-200',
                  'min-w-[180px]'
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={13} />
                  Event / Date
                </span>
              </th>

              {/* Role columns */}
              {roles.map((role) => (
                <th
                  key={role.id}
                  className={clsx(
                    'px-3 py-3 text-center text-xs font-semibold tracking-wide text-surface-500 uppercase',
                    'border-b border-surface-200',
                    'min-w-[160px]'
                  )}
                >
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body rows */}
          <tbody className="divide-y divide-surface-100">
            {events.map((event) => {
              const assignedToEvent = getAssignedToEvent(event.id);
              return (
                <tr
                  key={event.id}
                  className={clsx(
                    'transition-colors duration-200',
                    'hover:bg-surface-50/50'
                  )}
                >
                  {/* Sticky first column: event info */}
                  <td
                    className={clsx(
                      'sticky left-0 z-10 bg-white',
                      'px-4 py-3',
                      'border-r border-surface-200',
                      'group-hover:bg-surface-50'
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-surface-900">
                        {event.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-surface-500">
                        <Calendar size={11} />
                        {formatDate(event.date, 'EEE, MMM d')}
                      </span>
                      {event.time && (
                        <span className="inline-flex items-center gap-1 text-xs text-surface-400">
                          <Clock size={11} />
                          {event.time}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Assignment cells */}
                  {roles.map((role) => {
                    const cellKey = `${event.id}-${role.id}`;
                    return (
                      <td key={role.id} className="px-2 py-2">
                        <RosterCell
                          eventId={event.id}
                          roleId={role.id}
                          teamId={roster.team_id}
                          dateStr={event.date}
                          assignment={assignments[cellKey]}
                          assignmentCounts={assignmentCounts}
                          members={members}
                          onAssign={handleAssign}
                          onRemove={handleRemove}
                          onToggleManual={handleToggleManual}
                          assignedToEvent={assignedToEvent}
                          readOnly={readOnly}
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
      <div className="flex items-center gap-4 flex-wrap text-xs text-surface-400 px-1">
        <span className="inline-flex items-center gap-1">
          <Info size={12} />
          Click any cell to assign a member.
        </span>
        <span className="inline-flex items-center gap-1">
          <Pin size={12} className="text-amber-500" />
          Pinned assignments are preserved during shuffle.
        </span>
      </div>
    </div>
  );
}
