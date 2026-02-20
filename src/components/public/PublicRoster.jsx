import { useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  Users,
  Printer,
  Image,
  Eye,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';

/**
 * Public roster view -- read-only, shareable, mobile-friendly.
 *
 * @param {Object} props
 * @param {Object} props.organization  - { name, address, phone, email }
 * @param {Object} props.team          - { name }
 * @param {Object} props.roster        - { name, period, status }
 * @param {Array}  props.roles         - role name strings (columns)
 * @param {Array}  props.events        - [{ id, date, label }]
 * @param {Object} props.assignments   - { [eventId]: { [role]: memberName } }
 */
function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

export default function PublicRoster({
  organization,
  team,
  roster,
  roles = [],
  events = [],
  assignments = {},
  songsByEvent = {},
}) {
  const navigate = useNavigate();
  const { shareToken } = useParams();
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadRef = useRef(null);

  const handleViewMySchedule = useCallback(() => {
    navigate(`/r/${shareToken}/me`);
  }, [navigate, shareToken]);

  const handlePrint = useCallback(() => {
    setShowDownloadMenu(false);
    window.print();
  }, []);

  const toggleEventExpand = useCallback((eventId) => {
    setExpandedEvent((prev) => (prev === eventId ? null : eventId));
  }, []);

  return (
    <div className="print:p-0">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          {/* Organization avatar */}
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500 text-white font-bold text-sm shrink-0 print:bg-gray-700">
            {(organization.name || 'R')
              .split(' ')
              .map((w) => w[0] || '')
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'R'}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-surface-900 leading-tight print:text-black">
              {organization.name}
            </h1>
            <p className="text-sm text-surface-500 mt-0.5">
              {team.name}
            </p>
          </div>
        </div>

        <Badge color="success" size="md" dot className="self-start shrink-0 print:hidden">
          {roster.status || 'Published'}
        </Badge>
      </div>

      {/* Roster info */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-surface-200">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-surface-400" />
          <span className="text-sm font-semibold text-surface-800">
            {roster.name}
          </span>
        </div>
        <span className="text-surface-300">|</span>
        <span className="text-sm text-surface-600">{roster.period}</span>
        <span className="text-surface-300 hidden sm:inline">|</span>
        <div className="flex items-center gap-1.5">
          <Users size={14} className="text-surface-400" />
          <span className="text-sm text-surface-500">
            {roles.length} roles &middot; {events.length} events
          </span>
        </div>
      </div>

      {/* ── Desktop table view ────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto mb-6 print:block">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-surface-200">
              <th className="px-3 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wide bg-surface-50 rounded-tl-lg print:bg-gray-100">
                Date
              </th>
              {roles.map((role) => (
                <th
                  key={role}
                  className="px-3 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wide bg-surface-50 print:bg-gray-100"
                >
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {events.map((event, idx) => (
              <tr
                key={event.id}
                className={cn(
                  'transition-colors hover:bg-primary-50/30',
                  idx % 2 === 1 && 'bg-surface-50/40'
                )}
              >
                <td className="px-3 py-3">
                  <div className="font-semibold text-surface-900 whitespace-nowrap">
                    {formatDate(event.date, 'EEE, MMM d')}
                  </div>
                  <div className="text-xs text-surface-500 mt-0.5">{event.name}</div>
                  {event.time && (
                    <div className="text-xs text-surface-400">⛪ {fmtTime(event.time)}</div>
                  )}
                  {(event.rehearsalDate || event.rehearsalTime) && (
                    <div className="text-xs text-amber-600 mt-0.5">
                      🕐 Rehearsal: {event.rehearsalDate ? formatDate(event.rehearsalDate, 'EEE, MMM d') + ' ' : ''}{fmtTime(event.rehearsalTime)}
                    </div>
                  )}
                  {(songsByEvent[event.id] || []).length > 0 && (
                    <div className="text-xs text-violet-600 mt-0.5">
                      🎵 {(songsByEvent[event.id] || []).map((s) => `${s.title}${s.key ? ` (${s.key})` : ''}`).join(' · ')}
                    </div>
                  )}
                </td>
                {roles.map((role) => {
                  const member = assignments[event.id]?.[role];
                  return (
                    <td key={role} className="px-3 py-3">
                      {member ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={member} size="sm" className="ring-0" />
                          <span className="text-sm text-surface-800">
                            {member}
                          </span>
                        </div>
                      ) : (
                        <span className="text-surface-300">&mdash;</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card view ──────────────────────────────────── */}
      <div className="md:hidden space-y-3 mb-6 print:hidden">
        {events.map((event) => {
          const isExpanded = expandedEvent === event.id;
          const assignedRoles = roles.filter(
            (role) => assignments[event.id]?.[role]
          );

          return (
            <div
              key={event.id}
              className="border border-surface-200 rounded-xl overflow-hidden"
            >
              {/* Event header (always visible) */}
              <button
                type="button"
                onClick={() => toggleEventExpand(event.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-surface-50 hover:bg-surface-100 transition-colors text-left cursor-pointer"
              >
                <div>
                  <div className="font-medium text-surface-900 text-sm">
                    {formatDate(event.date, 'EEE, MMM d')} — {event.name}
                  </div>
                  {event.time && (
                    <div className="text-xs text-surface-400 mt-0.5">⛪ {fmtTime(event.time)}</div>
                  )}
                  {(event.rehearsalDate || event.rehearsalTime) && (
                    <div className="text-xs text-amber-600 mt-0.5">
                      🕐 Rehearsal: {event.rehearsalDate ? formatDate(event.rehearsalDate, 'EEE, MMM d') + ' ' : ''}{fmtTime(event.rehearsalTime)}
                    </div>
                  )}
                  {(songsByEvent[event.id] || []).length > 0 && (
                    <div className="text-xs text-violet-600 mt-0.5">
                      🎵 {(songsByEvent[event.id] || []).map((s) => `${s.title}${s.key ? ` (${s.key})` : ''}`).join(' · ')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-surface-400">
                    {assignedRoles.length}/{roles.length}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-surface-400" />
                  ) : (
                    <ChevronDown size={16} className="text-surface-400" />
                  )}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="divide-y divide-surface-100">
                  {roles.map((role) => {
                    const member = assignments[event.id]?.[role];
                    return (
                      <div
                        key={role}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <span className="text-xs font-medium text-surface-500 uppercase tracking-wide">
                          {role}
                        </span>
                        {member ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-surface-800">
                              {member}
                            </span>
                            <Avatar
                              name={member}
                              size="sm"
                              className="ring-0"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-surface-300">
                            Unassigned
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Actions ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-surface-200 print:hidden">
        <Button
          variant="primary"
          iconLeft={Eye}
          onClick={handleViewMySchedule}
          className="sm:flex-none"
        >
          View My Schedule
        </Button>

        <div className="flex gap-2 sm:ml-auto">
          <Button
            variant="outline"
            iconLeft={Printer}
            onClick={handlePrint}
            size="md"
          >
            Print / PDF
          </Button>
          <Button
            variant="ghost"
            iconLeft={Image}
            onClick={handlePrint}
            size="md"
          >
            Save as Image
          </Button>
        </div>
      </div>

      {/* ── Print-only full table (shown only when printing) ─── */}
      <div className="hidden print:block print:mt-8">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold">{organization.name}</h2>
          <p className="text-sm text-gray-500">{organization.address}</p>
        </div>
        <div className="border-t border-gray-300 pt-4 mt-6 text-center text-xs text-gray-400">
          Generated by RosterFlow &mdash; {formatDate(new Date(), 'MMMM d, yyyy')}
        </div>
      </div>
    </div>
  );
}
