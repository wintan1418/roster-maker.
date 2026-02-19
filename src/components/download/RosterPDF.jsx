import { useRef, useCallback } from 'react';
import { Printer } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import SignatureBlock from './SignatureBlock';

/**
 * Printable HTML template for a full team roster.
 * Designed to be A4-proportioned and print-friendly.
 *
 * @param {Object} props
 * @param {Object} props.organization  - { name, address, phone, email }
 * @param {Object} props.team          - { name }
 * @param {Object} props.roster        - { name, period, status }
 * @param {Array}  props.roles         - array of role name strings (columns)
 * @param {Array}  props.events        - array of { id, date, label }
 * @param {Object} props.assignments   - { [eventId]: { [role]: memberName } }
 * @param {Array}  [props.signatureLines]
 * @param {string} [props.className]
 */
export default function RosterPDF({
  organization,
  team,
  roster,
  roles,
  events,
  assignments,
  signatureLines,
  className,
}) {
  const printRef = useRef(null);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const defaultSignatureLines = [
    { label: 'Prepared by' },
    { label: 'Approved by' },
    { label: 'Team Lead Signature' },
    { label: "Pastor's Signature" },
    { label: 'Date' },
  ];

  return (
    <div className={cn('relative', className)}>
      {/* Print trigger button -- hidden during print */}
      <div className="flex justify-end mb-4 print:hidden">
        <Button
          variant="primary"
          iconLeft={Printer}
          onClick={handlePrint}
        >
          Print / Save as PDF
        </Button>
      </div>

      {/* ── Printable Content ─────────────────────────────────── */}
      <div
        ref={printRef}
        className={cn(
          'bg-white rounded-xl border border-surface-200 shadow-sm',
          'p-8 sm:p-10',
          'print:border-none print:shadow-none print:p-0 print:rounded-none',
          /* A4-friendly max width */
          'max-w-[210mm] mx-auto'
        )}
      >
        {/* Organization header */}
        <div className="text-center mb-8 print:mb-6">
          <h1 className="text-2xl font-bold text-surface-900 print:text-black">
            {organization.name}
          </h1>
          {organization.address && (
            <p className="text-sm text-surface-500 print:text-gray-500 mt-1">
              {organization.address}
            </p>
          )}
          {(organization.phone || organization.email) && (
            <p className="text-xs text-surface-400 print:text-gray-400 mt-0.5">
              {[organization.phone, organization.email]
                .filter(Boolean)
                .join('  |  ')}
            </p>
          )}
          <div className="mt-4 border-t border-surface-200 print:border-gray-300" />
        </div>

        {/* Roster title section */}
        <div className="mb-6 print:mb-4">
          <h2 className="text-xl font-semibold text-surface-900 print:text-black">
            {roster.name}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <span className="text-sm text-surface-600 print:text-gray-600">
              Team: <span className="font-medium">{team.name}</span>
            </span>
            <span className="text-sm text-surface-600 print:text-gray-600">
              Period: <span className="font-medium">{roster.period}</span>
            </span>
            {roster.status && (
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-600 print:text-gray-700">
                {roster.status}
              </span>
            )}
          </div>
        </div>

        {/* ── Roster table ─────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-surface-200 print:border-gray-400">
            <thead>
              <tr className="bg-surface-50 print:bg-gray-100">
                <th className="border border-surface-200 print:border-gray-400 px-3 py-2.5 text-left text-xs font-semibold text-surface-600 print:text-gray-700 uppercase tracking-wide whitespace-nowrap">
                  Date
                </th>
                {roles.map((role) => (
                  <th
                    key={role}
                    className="border border-surface-200 print:border-gray-400 px-3 py-2.5 text-left text-xs font-semibold text-surface-600 print:text-gray-700 uppercase tracking-wide whitespace-nowrap"
                  >
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event, idx) => (
                <tr
                  key={event.id}
                  className={cn(
                    idx % 2 === 0
                      ? 'bg-white'
                      : 'bg-surface-50/50 print:bg-gray-50'
                  )}
                >
                  <td className="border border-surface-200 print:border-gray-400 px-3 py-2 whitespace-nowrap font-medium text-surface-800 print:text-black">
                    <div className="text-sm">{formatDate(event.date, 'EEE, MMM d')}</div>
                    {event.label && (
                      <div className="text-xs text-surface-400 print:text-gray-400 mt-0.5">
                        {event.label}
                      </div>
                    )}
                  </td>
                  {roles.map((role) => {
                    const assignee =
                      assignments[event.id]?.[role] || '';
                    return (
                      <td
                        key={role}
                        className={cn(
                          'border border-surface-200 print:border-gray-400 px-3 py-2 text-sm',
                          assignee
                            ? 'text-surface-800 print:text-black'
                            : 'text-surface-300 print:text-gray-300'
                        )}
                      >
                        {assignee || '\u2014'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature block */}
        <SignatureBlock lines={signatureLines || defaultSignatureLines} />

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-surface-100 print:border-gray-200 text-center">
          <p className="text-xs text-surface-400 print:text-gray-400">
            {organization.name}
            {organization.address ? ` \u2022 ${organization.address}` : ''}
          </p>
          <p className="text-xs text-surface-300 print:text-gray-300 mt-0.5">
            Generated by RosterFlow &mdash; {formatDate(new Date(), 'MMMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* ── Print-specific styles ──────────────────────────── */}
      <style>{`
        @media print {
          /* Hide everything except the printable area */
          body * {
            visibility: hidden;
          }
          /* The printable ref and its children are visible */
          [data-print-root],
          [data-print-root] * {
            visibility: visible;
          }
          [data-print-root] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 15mm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
