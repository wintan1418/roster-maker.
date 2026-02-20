import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Calendar,
  ArrowLeft,
  Printer,
  Music,
  User,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';

/**
 * Personal schedule view -- shows an individual member's assignments.
 *
 * @param {Object}   props
 * @param {Object}   props.organization  - { name }
 * @param {Object}   props.team          - { name }
 * @param {Object}   props.roster        - { name, period }
 * @param {Object}   props.member        - { name, email, roles: string[] }
 * @param {Array}    props.duties        - [{ date, eventLabel, role }]
 * @param {Function} [props.onBack]      - optional back handler
 */
export default function PersonalSchedule({
  organization,
  team,
  roster,
  member,
  duties,
  onBack,
}) {
  const { shareToken } = useParams();

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="print:p-0">
      {/* ── Back link ─────────────────────────────────────────── */}
      <div className="mb-6 print:hidden">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back to Full Roster
          </button>
        ) : (
          <Link
            to={`/r/${shareToken}`}
            className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Full Roster
          </Link>
        )}
      </div>

      {/* ── Member header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 pb-6 border-b border-surface-200">
        <Avatar name={member.name} size="xl" className="ring-0" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-surface-900 print:text-black">
            {member.name}
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">{member.email}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge color="primary" size="sm">
              <Music size={12} />
              {team.name}
            </Badge>
            {(member.roles || []).map((role) => (
              <Badge key={role} color="default" size="sm">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* ── Schedule info ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-primary-500" />
          <span className="text-sm font-semibold text-surface-800">
            {roster.name}
          </span>
        </div>
        <span className="text-surface-300">|</span>
        <span className="text-sm text-surface-600">{roster.period}</span>
      </div>

      {/* ── Duty count highlight ──────────────────────────────── */}
      <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl mb-6 print:bg-gray-50 print:border print:border-gray-300">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 print:bg-gray-200">
          <User size={20} className="text-primary-600 print:text-gray-700" />
        </div>
        <div>
          <p className="text-2xl font-bold text-primary-700 print:text-black">
            {duties.length}
          </p>
          <p className="text-sm text-primary-600 print:text-gray-600">
            Total duties this period
          </p>
        </div>
      </div>

      {/* ── Duty list ─────────────────────────────────────────── */}
      <div className="space-y-3 mb-6">
        <h2 className="text-sm font-semibold text-surface-600 uppercase tracking-wide">
          Your Assignments
        </h2>

        {duties.map((duty, idx) => (
          <div
            key={idx}
            className={cn(
              'flex items-center gap-4 p-4 rounded-xl border transition-colors',
              'border-surface-200 hover:border-primary-200 hover:bg-primary-50/30',
              'print:border-gray-300 print:rounded-none'
            )}
          >
            {/* Date badge */}
            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-surface-50 border border-surface-200 shrink-0 print:bg-gray-50 print:border-gray-300">
              <span className="text-xs font-semibold text-primary-600 uppercase print:text-gray-600">
                {formatDate(duty.date, 'MMM')}
              </span>
              <span className="text-lg font-bold text-surface-900 leading-tight print:text-black">
                {formatDate(duty.date, 'd')}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-surface-900 text-sm print:text-black">
                {formatDate(duty.date, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-xs text-surface-500 mt-0.5">
                {duty.eventLabel}
              </p>
              <Badge
                color="primary"
                size="sm"
                className="mt-1.5"
              >
                {duty.role}
              </Badge>
            </div>

            {/* Checkmark */}
            <CheckCircle2
              size={20}
              className="text-emerald-500 shrink-0 print:text-gray-600"
            />
          </div>
        ))}
      </div>

      {/* ── Actions ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-surface-200 print:hidden">
        <Button
          variant="primary"
          iconLeft={Printer}
          onClick={handlePrint}
        >
          Download My Schedule
        </Button>

        {onBack ? (
          <Button variant="ghost" iconLeft={ArrowLeft} onClick={onBack}>
            Back to Full Roster
          </Button>
        ) : (
          <Link to={`/r/${shareToken}`}>
            <Button variant="ghost" iconLeft={ArrowLeft}>
              Back to Full Roster
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
