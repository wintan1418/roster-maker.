import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
  Plus,
  Copy,
  X,
  MoreVertical,
  ChevronDown,
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
  teamRoles = [],
  initialAssignments = {},
  onPreview,
  onPublish,
  onSave,
  onAddEvent,
  onRemoveEvent,
  onDuplicateRole,
  onRemoveRole,
  onAddRole,
  readOnly = false,
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [hasChanges, setHasChanges] = useState(false);

  const { shuffle, clearAutoAssignments, isShuffling } = useShuffle();

  // Build lookup: role name → team_role UUID for member filtering
  const roleNameToId = useMemo(() => {
    const map = {};
    for (const tr of teamRoles) {
      map[tr.name] = tr.id;
    }
    return map;
  }, [teamRoles]);

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
      members,
      roleNameToId,
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
      members,
      roleNameToId,
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

  const handleSave = async () => {
    try {
      await onSave?.(assignments);
      setHasChanges(false);
      toast.success('Roster saved successfully!');
    } catch {
      // Error toast already shown by parent
    }
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

              {/* Role columns with dropdown menu */}
              {roles.map((role) => (
                <ColumnHeader
                  key={role.id}
                  role={role}
                  readOnly={readOnly}
                  onDuplicate={() => onDuplicateRole?.(role)}
                  onRemove={() => onRemoveRole?.(role)}
                  canRemove={roles.length > 1}
                />
              ))}

              {/* Add Role column */}
              {!readOnly && (
                <AddRoleColumn teamRoles={teamRoles} onAddRole={onAddRole} />
              )}
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
                    'hover:bg-surface-50/50',
                    'group'
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
                    <div className="flex items-start justify-between gap-2">
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
                      {!readOnly && onRemoveEvent && (
                        <button
                          onClick={() => onRemoveEvent(event.id)}
                          className="p-1 rounded text-surface-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                          title="Remove event"
                        >
                          <X size={14} />
                        </button>
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
                          teamRoleId={roleNameToId[role.originalRole?.name || role.name.replace(/\s+\d+$/, '')] || null}
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

                  {/* Empty cell for add-role column */}
                  {!readOnly && <td />}
                </tr>
              );
            })}
            {/* Add Event row */}
            {!readOnly && onAddEvent && (
              <AddEventRow
                colSpan={roles.length + 1 + (!readOnly ? 1 : 0)}
                onAddEvent={onAddEvent}
                rosterStartDate={roster.start_date}
                rosterEndDate={roster.end_date}
              />
            )}
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
        {!readOnly && (
          <span className="inline-flex items-center gap-1">
            <MoreVertical size={12} />
            Click a column header to add/remove role columns.
          </span>
        )}
      </div>
    </div>
  );
}

// ── Column Header with dropdown ─────────────────────────────────────────────

function ColumnHeader({ role, readOnly, onDuplicate, onRemove, canRemove }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <th
      ref={ref}
      className={clsx(
        'px-3 py-3 text-center text-xs font-semibold tracking-wide text-surface-500 uppercase',
        'border-b border-surface-200',
        'min-w-[160px]',
        'relative group'
      )}
    >
      <div className="flex items-center justify-center gap-1">
        <span>{role.name}</span>
        {!readOnly && (
          <button
            onClick={() => setOpen(!open)}
            className={clsx(
              'p-0.5 rounded transition-all duration-150 cursor-pointer',
              open
                ? 'opacity-100 bg-surface-200'
                : 'opacity-0 group-hover:opacity-100 hover:bg-surface-200'
            )}
          >
            <ChevronDown size={12} />
          </button>
        )}
      </div>

      {open && !readOnly && (
        <div
          className={clsx(
            'absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50',
            'w-44 bg-white rounded-lg border border-surface-200 shadow-lg',
            'py-1 text-left'
          )}
          style={{ animation: 'popoverIn 0.12s ease-out' }}
        >
          <button
            onClick={() => { onDuplicate(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors cursor-pointer"
          >
            <Copy size={14} className="text-primary-500" />
            <span className="normal-case tracking-normal font-normal">Add another</span>
          </button>
          {canRemove && (
            <button
              onClick={() => { onRemove(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <X size={14} />
              <span className="normal-case tracking-normal font-normal">Remove column</span>
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes popoverIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-4px) scale(0.97); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
    </th>
  );
}

// ── Add Role Column ─────────────────────────────────────────────────────────

function AddRoleColumn({ teamRoles = [], onAddRole }) {
  const [open, setOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleAdd = (name) => {
    if (!name.trim()) return;
    onAddRole?.(name.trim());
    setOpen(false);
    setCustomName('');
  };

  return (
    <th
      ref={ref}
      className={clsx(
        'px-2 py-3 text-center',
        'border-b border-surface-200',
        'min-w-[60px] w-[60px]',
        'relative'
      )}
    >
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          'w-8 h-8 rounded-lg border-2 border-dashed flex items-center justify-center mx-auto',
          'transition-all duration-200 cursor-pointer',
          open
            ? 'border-primary-400 bg-primary-50 text-primary-600'
            : 'border-surface-300 text-surface-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50'
        )}
      >
        <Plus size={16} />
      </button>

      {open && (
        <div
          className={clsx(
            'absolute top-full right-0 mt-1 z-50',
            'w-56 bg-white rounded-lg border border-surface-200 shadow-lg',
            'text-left overflow-hidden'
          )}
          style={{ animation: 'addRoleIn 0.12s ease-out' }}
        >
          {/* Custom name input */}
          <div className="p-2 border-b border-surface-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAdd(customName);
              }}
              className="flex gap-1"
            >
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Custom role..."
                autoFocus
                className={clsx(
                  'flex-1 px-2 py-1.5 text-sm rounded-md',
                  'bg-surface-50 border border-surface-200',
                  'placeholder:text-surface-400 text-surface-900',
                  'focus:outline-none focus:ring-1 focus:ring-primary-500'
                )}
              />
              <button
                type="submit"
                disabled={!customName.trim()}
                className="px-2 py-1.5 rounded-md bg-primary-500 text-white text-xs font-medium disabled:opacity-40 hover:bg-primary-600 transition-colors cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>

          {/* Team roles quick-pick */}
          {teamRoles.length > 0 && (
            <div className="max-h-48 overflow-y-auto py-1">
              <p className="px-3 py-1 text-[10px] font-semibold text-surface-400 uppercase tracking-wider">
                Team Roles
              </p>
              {teamRoles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleAdd(r.name)}
                  className="w-full text-left px-3 py-1.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors cursor-pointer normal-case tracking-normal font-normal"
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes addRoleIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </th>
  );
}

// ── Add Event Row ────────────────────────────────────────────────────────────

function AddEventRow({ colSpan, onAddEvent, rosterStartDate, rosterEndDate }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !date) return;
    onAddEvent({ name: name.trim(), date, time: time || null });
    setName('');
    setDate('');
    setTime('');
    setOpen(false);
  };

  if (!open) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-4 py-2">
          <button
            onClick={() => setOpen(true)}
            className={clsx(
              'w-full flex items-center justify-center gap-2 py-2 rounded-lg',
              'border-2 border-dashed border-surface-200 text-surface-400',
              'hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/50',
              'transition-all duration-200 cursor-pointer text-sm'
            )}
          >
            <Plus size={15} />
            Add Event
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">
              Event Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunday Service"
              autoFocus
              className={clsx(
                'px-3 py-1.5 text-sm rounded-md w-48',
                'bg-surface-50 border border-surface-200',
                'placeholder:text-surface-400 text-surface-900',
                'focus:outline-none focus:ring-1 focus:ring-primary-500'
              )}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={rosterStartDate}
              max={rosterEndDate}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-md',
                'bg-surface-50 border border-surface-200 text-surface-900',
                'focus:outline-none focus:ring-1 focus:ring-primary-500'
              )}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">
              Time <span className="text-surface-300">(optional)</span>
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-md',
                'bg-surface-50 border border-surface-200 text-surface-900',
                'focus:outline-none focus:ring-1 focus:ring-primary-500'
              )}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!name.trim() || !date}
              className="px-3 py-1.5 rounded-md bg-primary-500 text-white text-sm font-medium disabled:opacity-40 hover:bg-primary-600 transition-colors cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setName(''); setDate(''); setTime(''); }}
              className="px-3 py-1.5 rounded-md text-sm text-surface-500 hover:bg-surface-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
