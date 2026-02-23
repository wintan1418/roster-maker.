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
  Music,
  CheckSquare,
  Check,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import ShuffleButton from '@/components/roster/ShuffleButton';
import RosterCell from '@/components/roster/RosterCell';
import useShuffle from '@/hooks/useShuffle';
import { formatDate, getSessionFromTime, isMemberUnavailable } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import useAuthStore from '@/stores/authStore';

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
  availabilityMap = {},
  onPreview,
  onPublish,
  onSave,
  onAddEvent,
  onRemoveEvent,
  onUpdateEvent,
  onDuplicateRole,
  onRemoveRole,
  onAddRole,
  readOnly = false,
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [hasChanges, setHasChanges] = useState(false);
  const [songsEvent, setSongsEvent] = useState(null);   // event for setlist modal
  const [attendanceEvent, setAttendanceEvent] = useState(null); // event for attendance modal
  const { orgRole } = useAuthStore();
  const isAdmin = orgRole === 'super_admin' || orgRole === 'team_admin';

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

  // Detect conflicts: same member assigned to multiple roles on same event
  const conflictingCells = useMemo(() => {
    const conflicting = new Set();
    const byEvent = {};
    for (const [key, value] of Object.entries(assignments)) {
      if (!value?.memberId) continue;
      const dashIdx = key.indexOf('-');
      const eventId = key.substring(0, dashIdx);
      if (!byEvent[eventId]) byEvent[eventId] = {};
      if (!byEvent[eventId][value.memberId]) byEvent[eventId][value.memberId] = [];
      byEvent[eventId][value.memberId].push(key);
    }
    for (const eventMap of Object.values(byEvent)) {
      for (const keys of Object.values(eventMap)) {
        if (keys.length > 1) keys.forEach((k) => conflicting.add(k));
      }
    }
    return conflicting;
  }, [assignments]);

  const conflictCount = conflictingCells.size / 2; // pairs

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
      availabilityMap,
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
      availabilityMap,
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

      {/* Conflict warning */}
      {conflictingCells.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <Info size={15} className="shrink-0 text-red-500" />
          <span>
            <strong>Conflict detected:</strong> {Math.ceil(conflictingCells.size / 2)} member{Math.ceil(conflictingCells.size / 2) !== 1 ? 's are' : ' is'} assigned to multiple roles on the same date. Highlighted in red.
          </span>
        </div>
      )}

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
              const eventSession = getSessionFromTime(event.time);
              const unavailableCount = members.filter((m) => {
                const { unavailable } = isMemberUnavailable(availabilityMap, m.user_id, event.date, eventSession);
                return unavailable;
              }).length;
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
                        {!readOnly && onUpdateEvent ? (
                          <div className="flex flex-col gap-0.5">
                            <label className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                              <Clock size={11} />
                              <span>Rehearsal</span>
                            </label>
                            <input
                              type="date"
                              value={event.rehearsalDate || ''}
                              onChange={(e) => onUpdateEvent(event.id, { rehearsalDate: e.target.value || null })}
                              className="w-32 px-1 py-0.5 text-xs rounded border border-amber-200 bg-amber-50 text-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
                              placeholder="Date"
                            />
                            <input
                              type="time"
                              value={event.rehearsalTime || ''}
                              onChange={(e) => onUpdateEvent(event.id, { rehearsalTime: e.target.value || null })}
                              className="w-24 px-1 py-0.5 text-xs rounded border border-amber-200 bg-amber-50 text-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
                            />
                          </div>
                        ) : (event.rehearsalDate || event.rehearsalTime) ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <Clock size={11} />
                            {event.rehearsalDate ? `${event.rehearsalDate} ` : ''}{event.rehearsalTime || ''}
                          </span>
                        ) : null}
                        {event.time && (
                          <span className="inline-flex items-center gap-1 text-xs text-surface-400">
                            <Clock size={11} />
                            Service {event.time}
                          </span>
                        )}
                        {unavailableCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                            <AlertTriangle size={11} />
                            {unavailableCount} unavailable
                          </span>
                        )}
                        {/* Event action buttons */}
                        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSongsEvent(event)}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-violet-600 bg-violet-50 hover:bg-violet-100 cursor-pointer transition-colors"
                            title="Manage setlist"
                          >
                            <Music size={9} /> Songs
                          </button>
                          {isAdmin && event.date < new Date().toISOString().split('T')[0] && (
                            <button
                              onClick={() => setAttendanceEvent(event)}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-emerald-600 bg-emerald-50 hover:bg-emerald-100 cursor-pointer transition-colors"
                              title="Mark attendance"
                            >
                              <CheckSquare size={9} /> Attendance
                            </button>
                          )}
                        </div>
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
                          eventSession={eventSession}
                          availabilityMap={availabilityMap}
                          assignment={assignments[cellKey]}
                          assignmentCounts={assignmentCounts}
                          members={members}
                          onAssign={handleAssign}
                          onRemove={handleRemove}
                          onToggleManual={handleToggleManual}
                          assignedToEvent={assignedToEvent}
                          hasConflict={conflictingCells.has(cellKey)}
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

      {/* Setlist Modal (Feature 6) */}
      {songsEvent && (
        <SetlistModal
          event={songsEvent}
          teamId={roster.team_id}
          roles={roles}
          assignments={assignments}
          members={members}
          isAdmin={isAdmin}
          onClose={() => setSongsEvent(null)}
        />
      )}

      {/* Attendance Modal (Feature 4) */}
      {attendanceEvent && (
        <AttendanceModal
          event={attendanceEvent}
          teamId={roster.team_id}
          assignments={assignments}
          members={members}
          onClose={() => setAttendanceEvent(null)}
        />
      )}
    </div>
  );
}

// ── Setlist Modal (Feature 6) ─────────────────────────────────────────────

function SetlistModal({ event, teamId, roles = [], assignments = {}, members = [], isAdmin = false, onClose }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [adding, setAdding] = useState(false);
  const { user } = useAuthStore();

  // Allow write if admin OR if current user is assigned as a worship leader for this event
  const currentMember = useMemo(() => members.find(m => m.user_id === user?.id), [members, user?.id]);
  const canEdit = useMemo(() => {
    if (isAdmin) return true;
    if (!currentMember) return false;
    return roles.some(role => {
      if (!role.name.toLowerCase().includes('worship')) return false;
      const cellKey = `${event.id}-${role.id}`;
      return assignments[cellKey]?.memberId === currentMember.id;
    });
  }, [isAdmin, currentMember, roles, assignments, event.id]);

  useEffect(() => {
    if (!supabase || !event?.id) return;
    setLoading(true);
    supabase.from('event_songs')
      .select('*')
      .eq('roster_event_id', event.id)
      .order('sort_order', { ascending: true })
      .then(({ data }) => { setSongs(data ?? []); setLoading(false); });
  }, [event?.id]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim() || !supabase) return;
    setAdding(true);
    const { data, error } = await supabase.from('event_songs').insert({
      roster_event_id: event.id,
      team_id: teamId,
      title: title.trim(),
      artist: artist.trim() || null,
      key: key.trim() || null,
      sort_order: songs.length,
      added_by: user?.id,
    }).select().single();
    if (error) { console.error('Song insert error:', error); toast.error(error.message || 'Failed to add song'); }
    else { setSongs((prev) => [...prev, data]); setTitle(''); setArtist(''); setKey(''); }
    setAdding(false);
  }

  async function handleDelete(id) {
    await supabase.from('event_songs').delete().eq('id', id);
    setSongs((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
              <Music size={18} className="text-violet-500" /> Setlist
            </h3>
            <p className="text-xs text-surface-500 mt-0.5">{event.name} · {formatDate(event.date, 'EEE, MMM d')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 cursor-pointer"><X size={18} className="text-surface-500" /></button>
        </div>

        {/* Song list */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-1.5 min-h-0">
          {loading ? (
            <p className="text-sm text-surface-400 text-center py-4">Loading...</p>
          ) : songs.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-4">No songs yet. Add one below.</p>
          ) : (
            songs.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-50 border border-surface-100">
                <span className="text-xs font-bold text-surface-300 w-4 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{s.title}</p>
                  <p className="text-xs text-surface-400 truncate">
                    {s.artist && <span>{s.artist}</span>}
                    {s.key && <span className="ml-1.5 font-mono text-violet-600">Key: {s.key}</span>}
                  </p>
                </div>
                <button onClick={() => handleDelete(s.id)} className="p-1 rounded hover:bg-red-50 text-surface-300 hover:text-red-500 cursor-pointer">
                  <X size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add song form */}
        <form onSubmit={handleAdd} className="border-t border-surface-200 pt-4 space-y-2">
          <input
            value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Song title *"
            className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 bg-surface-50 text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
          <div className="flex gap-2">
            <input
              value={artist} onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist (optional)"
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-surface-200 bg-surface-50 text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <input
              value={key} onChange={(e) => setKey(e.target.value)}
              placeholder="Key"
              className="w-20 px-3 py-2 text-sm rounded-lg border border-surface-200 bg-surface-50 text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <button type="submit" disabled={!title.trim() || adding}
            className="w-full py-2 rounded-lg bg-violet-500 text-white text-sm font-medium disabled:opacity-40 hover:bg-violet-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5">
            <Plus size={15} /> Add Song
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Attendance Modal (Feature 4) ──────────────────────────────────────────

const ATTENDANCE_STATUS = [
  { value: 'present', label: 'Present', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'absent', label: 'Absent', color: 'text-red-700 bg-red-50 border-red-200' },
  { value: 'excused', label: 'Excused', color: 'text-amber-700 bg-amber-50 border-amber-200' },
];

function AttendanceModal({ event, teamId, assignments, members, onClose }) {
  const { user } = useAuthStore();
  // Get members assigned to this event
  const eventMembers = useMemo(() => {
    const ids = new Set();
    for (const [key, val] of Object.entries(assignments)) {
      if (key.startsWith(event.id + '-') && val?.memberId) ids.add(val.memberId);
    }
    return members.filter((m) => ids.has(m.id) || ids.has(m.user_id));
  }, [event.id, assignments, members]);

  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase || !event?.id) return;
    supabase.from('attendance_records')
      .select('*')
      .eq('roster_event_id', event.id)
      .then(({ data }) => {
        const map = {};
        for (const r of (data ?? [])) map[r.user_id] = r.status;
        setRecords(map);
        setLoading(false);
      });
  }, [event?.id]);

  function setStatus(userId, status) {
    setRecords((prev) => ({ ...prev, [userId]: status }));
  }

  async function handleSave() {
    if (!supabase) return;
    setSaving(true);
    try {
      const upserts = eventMembers.map((m) => ({
        roster_event_id: event.id,
        user_id: m.user_id || m.id,
        team_id: teamId,
        status: records[m.user_id || m.id] || 'present',
        marked_by: user?.id,
        marked_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('attendance_records')
        .upsert(upserts, { onConflict: 'roster_event_id,user_id' });
      if (error) throw error;
      toast.success('Attendance saved!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
              <CheckSquare size={18} className="text-emerald-500" /> Attendance
            </h3>
            <p className="text-xs text-surface-500 mt-0.5">{event.name} · {formatDate(event.date, 'EEE, MMM d')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 cursor-pointer"><X size={18} className="text-surface-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 space-y-2 min-h-0">
          {loading ? (
            <p className="text-sm text-surface-400 text-center py-4">Loading...</p>
          ) : eventMembers.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-4">No assigned members for this event.</p>
          ) : (
            eventMembers.map((m) => {
              const uid = m.user_id || m.id;
              const current = records[uid] || 'present';
              return (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-surface-100 bg-surface-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{m.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {ATTENDANCE_STATUS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setStatus(uid, s.value)}
                        className={clsx(
                          'px-2 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer',
                          current === s.value ? s.color : 'text-surface-400 bg-white border-surface-200 hover:border-surface-300'
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex gap-3 border-t border-surface-200 pt-4">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving} iconLeft={Check} className="flex-1">Save Attendance</Button>
        </div>
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
  const [rehearsalDate, setRehearsalDate] = useState('');
  const [rehearsalTime, setRehearsalTime] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !date) return;
    onAddEvent({ name: name.trim(), date, time: time || null, rehearsalDate: rehearsalDate || null, rehearsalTime: rehearsalTime || null });
    setName('');
    setDate('');
    setTime('');
    setRehearsalDate('');
    setRehearsalTime('');
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
              Service Time <span className="text-surface-300">(optional)</span>
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
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
              Rehearsal Date <span className="text-surface-300">(optional)</span>
            </label>
            <input
              type="date"
              value={rehearsalDate}
              onChange={(e) => setRehearsalDate(e.target.value)}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-md',
                'bg-amber-50 border border-amber-200 text-surface-900',
                'focus:outline-none focus:ring-1 focus:ring-amber-400'
              )}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
              Rehearsal Time <span className="text-surface-300">(optional)</span>
            </label>
            <input
              type="time"
              value={rehearsalTime}
              onChange={(e) => setRehearsalTime(e.target.value)}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-md',
                'bg-amber-50 border border-amber-200 text-surface-900',
                'focus:outline-none focus:ring-1 focus:ring-amber-400'
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
              onClick={() => { setOpen(false); setName(''); setDate(''); setTime(''); setRehearsalTime(''); }}
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
