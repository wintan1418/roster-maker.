import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pin, Shuffle, X, User, Check, AlertTriangle, UserPlus } from 'lucide-react';
import clsx from 'clsx';
import Avatar from '@/components/ui/Avatar';
import { isMemberUnavailable } from '@/lib/utils';

/**
 * RosterCell - An individual cell in the roster grid.
 * Shows the assigned member or an add button.
 * Opens a popover/dropdown to pick a member.
 */
export default function RosterCell({
  eventId,
  roleId,
  teamRoleId,
  teamId,
  dateStr,
  eventSession = 'all_day',
  availabilityMap = {},
  assignment,          // { memberId, manual } | undefined
  assignmentCounts,    // { memberId: count } for sorting
  onAssign,            // (eventId, roleId, memberId) => void
  onRemove,            // (eventId, roleId) => void
  onToggleManual,      // (eventId, roleId) => void
  onAddGuest,          // (name, email) => guestId
  assignedToEvent,     // Set of memberIds already assigned to this event
  members = [],        // all team members
  hasConflict = false, // true when member is double-booked on this event
  readOnly = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const cellRef = useRef(null);
  const dropdownRef = useRef(null);

  const member = assignment?.memberId
    ? members.find((m) => m.id === assignment.memberId || m.user_id === assignment.memberId)
    : null;

  const isManual = assignment?.manual ?? false;

  // Check if the currently assigned member is unavailable
  const assignedMemberUnavailable = useMemo(() => {
    if (!assignment?.memberId || !member) return false;
    const { unavailable } = isMemberUnavailable(availabilityMap, member.user_id, dateStr, eventSession);
    return unavailable;
  }, [assignment?.memberId, member, availabilityMap, dateStr, eventSession]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        cellRef.current &&
        !cellRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Get all team members with assignment info and role matching
  const memberOptions = useCallback(() => {
    return members
      .map((m) => {
        const { unavailable } = isMemberUnavailable(availabilityMap, m.user_id, dateStr, eventSession);
        return {
          ...m,
          available: !unavailable,
          alreadyAssigned: assignedToEvent?.has(m.id) && m.id !== assignment?.memberId,
          count: assignmentCounts?.[m.id] || 0,
          isSelected: m.id === assignment?.memberId,
          matchesRole: teamRoleId ? (m.roleIds || []).includes(teamRoleId) : true,
        };
      })
      // Hard block: filter out unavailable members (keep currently selected so admin can see & remove)
      .filter((m) => m.available || m.isSelected)
      .sort((a, b) => {
        // Selected first
        if (a.isSelected && !b.isSelected) return -1;
        if (!a.isSelected && b.isSelected) return 1;
        // Role matches before non-matches
        if (a.matchesRole && !b.matchesRole) return -1;
        if (!a.matchesRole && b.matchesRole) return 1;
        // Not assigned to event before already assigned
        if (!a.alreadyAssigned && b.alreadyAssigned) return -1;
        if (a.alreadyAssigned && !b.alreadyAssigned) return 1;
        // Fewest assignments first
        return a.count - b.count;
      });
  }, [members, assignedToEvent, assignment, assignmentCounts, teamRoleId, availabilityMap, dateStr, eventSession]);

  const handleCellClick = () => {
    if (readOnly) return;
    setIsOpen(true);
  };

  const handleSelectMember = (memberId) => {
    onAssign?.(eventId, roleId, memberId);
    setIsOpen(false);
    setSearch('');
    setShowGuestForm(false);
    setGuestName('');
    setGuestEmail('');
  };

  const handleAddGuest = () => {
    if (!guestName.trim()) return;
    const guestId = onAddGuest?.(guestName.trim(), guestEmail.trim());
    if (guestId) {
      onAssign?.(eventId, roleId, guestId);
    }
    setIsOpen(false);
    setSearch('');
    setShowGuestForm(false);
    setGuestName('');
    setGuestEmail('');
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove?.(eventId, roleId);
    setIsOpen(false);
  };

  const handleToggleManual = (e) => {
    e.stopPropagation();
    onToggleManual?.(eventId, roleId);
  };

  const filteredOptions = memberOptions().filter((m) => {
    // Text search only — role matching is used for sorting, not filtering
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="relative" ref={cellRef}>
      {/* Cell content */}
      <button
        onClick={handleCellClick}
        disabled={readOnly}
        className={clsx(
          'w-full h-full min-h-[3rem] px-2 py-1.5 rounded-lg',
          'flex items-center gap-2 text-left',
          'transition-all duration-200',
          readOnly
            ? 'cursor-default'
            : 'cursor-pointer hover:ring-2 hover:ring-primary-300 active:ring-primary-400',
          hasConflict
            ? 'bg-red-50 hover:bg-red-100/80 ring-1 ring-red-300'
            : assignedMemberUnavailable
              ? 'bg-red-50/60 hover:bg-red-100/70 ring-1 ring-red-200'
              : member
                ? 'bg-sky-50/70 hover:bg-sky-100/80'
                : 'bg-amber-50/50 hover:bg-amber-100/60',
          isOpen && 'ring-2 ring-primary-400 bg-primary-50'
        )}
      >
        {member ? (
          <>
            <Avatar name={member.name} size="sm" className="flex-shrink-0 ring-1 ring-white" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-surface-800 truncate leading-tight">
                {member.name}
              </p>
              {member?.isGuest ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-600">
                  <UserPlus size={9} /> Guest
                </span>
              ) : assignedMemberUnavailable ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-red-600">
                  <AlertTriangle size={9} /> Unavailable
                </span>
              ) : isManual ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600">
                  <Pin size={9} /> Pinned
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-primary-500">
                  <Shuffle size={9} /> Auto
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center w-full">
            <div className="flex items-center gap-1 text-surface-400">
              <Plus size={14} />
              <span className="text-xs">Assign</span>
            </div>
          </div>
        )}
      </button>

      {/* Dropdown / Popover */}
      {isOpen && !readOnly && (
        <div
          ref={dropdownRef}
          className={clsx(
            'absolute z-50 top-full left-0 mt-1',
            'w-64 max-h-72 overflow-hidden',
            'bg-white rounded-xl border border-surface-200 shadow-xl',
            'animate-in fade-in slide-in-from-top-1 duration-200'
          )}
          style={{
            animation: 'popoverIn 0.15s ease-out',
          }}
        >
          {/* Header with search */}
          <div className="p-2 border-b border-surface-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              autoFocus
              className={clsx(
                'w-full px-2.5 py-1.5 text-sm rounded-lg',
                'bg-surface-50 border border-surface-200',
                'placeholder:text-surface-400 text-surface-900',
                'focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white'
              )}
            />
          </div>

          {/* Actions for assigned cell */}
          {member && (
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-surface-100">
              <button
                onClick={handleToggleManual}
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 text-xs rounded-md',
                  'transition-colors duration-200 cursor-pointer',
                  isManual
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'bg-surface-50 text-surface-600 hover:bg-surface-100'
                )}
              >
                <Pin size={11} />
                {isManual ? 'Unpin' : 'Pin'}
              </button>
              <button
                onClick={handleRemove}
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 text-xs rounded-md',
                  'text-red-600 hover:bg-red-50',
                  'transition-colors duration-200 cursor-pointer'
                )}
              >
                <X size={11} />
                Remove
              </button>
            </div>
          )}

          {/* Member list — strictly filtered by role */}
          <div className="overflow-y-auto max-h-48">
            {members.length === 0 && !showGuestForm ? (
              <div className="p-4 text-center text-sm text-surface-400">
                <User size={20} className="mx-auto mb-1 opacity-50" />
                <p>No team members yet</p>
                <p className="text-xs mt-0.5">Add a guest or team members first</p>
              </div>
            ) : filteredOptions.length === 0 && !showGuestForm ? (
              <div className="p-3 text-center text-sm text-surface-400">
                <User size={20} className="mx-auto mb-1 opacity-50" />
                {teamRoleId
                  ? 'No available members for this role'
                  : 'No available members found'}
              </div>
            ) : !showGuestForm && (
              filteredOptions.map((m) => (
                <MemberOption key={m.id} m={m} onSelect={handleSelectMember} />
              ))
            )}

            {/* Guest form */}
            {showGuestForm && (
              <div className="p-2.5 space-y-2">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Name *"
                  autoFocus
                  className="w-full px-2.5 py-1.5 text-sm rounded-lg bg-surface-50 border border-surface-200 placeholder:text-surface-400 text-surface-900 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
                />
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="Email (optional)"
                  className="w-full px-2.5 py-1.5 text-sm rounded-lg bg-surface-50 border border-surface-200 placeholder:text-surface-400 text-surface-900 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGuest()}
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={handleAddGuest}
                    disabled={!guestName.trim()}
                    className="flex-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Add & Assign
                  </button>
                  <button
                    onClick={() => { setShowGuestForm(false); setGuestName(''); setGuestEmail(''); }}
                    className="px-2.5 py-1.5 text-xs rounded-lg text-surface-500 hover:bg-surface-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add Guest button at bottom */}
          {!showGuestForm && onAddGuest && (
            <div className="border-t border-surface-100">
              <button
                onClick={() => setShowGuestForm(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
              >
                <UserPlus size={14} />
                Add Guest Member
              </button>
            </div>
          )}
        </div>
      )}

      {/* Inline keyframe for the popover animation */}
      <style>{`
        @keyframes popoverIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function MemberOption({ m, onSelect }) {
  return (
    <button
      onClick={() => onSelect(m.id)}
      className={clsx(
        'w-full flex items-center gap-2.5 px-3 py-2 text-left',
        'transition-colors duration-150',
        m.isSelected
          ? 'bg-primary-50 border-l-2 border-primary-500'
          : 'border-l-2 border-transparent',
        'hover:bg-surface-50 cursor-pointer'
      )}
    >
      <Avatar name={m.name} size="sm" className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            'text-sm font-medium truncate',
            m.isSelected ? 'text-primary-700' : 'text-surface-800'
          )}
        >
          {m.name}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-surface-400">
          {m.isGuest && <span className="text-purple-500 font-medium">Guest</span>}
          <span>{m.count} assignment{m.count !== 1 ? 's' : ''}</span>
          {m.alreadyAssigned && (
            <span className="text-amber-500">Also in this event</span>
          )}
        </div>
      </div>
      {m.isSelected && (
        <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
          <Check size={10} className="text-white" />
        </div>
      )}
    </button>
  );
}
