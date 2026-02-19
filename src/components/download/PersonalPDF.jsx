import { useCallback } from 'react';
import { Printer, CheckCircle2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import SignatureBlock from './SignatureBlock';

/**
 * Printable HTML template for a personal duty schedule.
 *
 * @param {Object} props
 * @param {Object} props.organization  - { name, address, phone, email }
 * @param {Object} props.team          - { name }
 * @param {Object} props.roster        - { name, period }
 * @param {Object} props.member        - { name, email, roles: string[] }
 * @param {Array}  props.duties        - [{ date, eventLabel, role }]
 * @param {string} [props.className]
 */
export default function PersonalPDF({
  organization,
  team,
  roster,
  member,
  duties,
  className,
}) {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* Print trigger -- hidden during print */}
      <div className="flex justify-end mb-4 print:hidden">
        <Button
          variant="primary"
          iconLeft={Printer}
          onClick={handlePrint}
        >
          Print / Save as PDF
        </Button>
      </div>

      {/* ── Printable content ──────────────────────────────── */}
      <div
        className={cn(
          'bg-white rounded-xl border border-surface-200 shadow-sm',
          'p-8 sm:p-10',
          'print:border-none print:shadow-none print:p-0 print:rounded-none',
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
          <div className="mt-4 border-t border-surface-200 print:border-gray-300" />
        </div>

        {/* Personal schedule title */}
        <div className="mb-6 print:mb-4">
          <h2 className="text-xl font-semibold text-surface-900 print:text-black">
            Personal Duty Schedule
          </h2>
          <div className="mt-2 space-y-0.5">
            <p className="text-sm text-surface-700 print:text-gray-700">
              <span className="text-surface-500 print:text-gray-500">Name:</span>{' '}
              <span className="font-medium">{member.name}</span>
            </p>
            <p className="text-sm text-surface-700 print:text-gray-700">
              <span className="text-surface-500 print:text-gray-500">Team:</span>{' '}
              <span className="font-medium">{team.name}</span>
            </p>
            <p className="text-sm text-surface-700 print:text-gray-700">
              <span className="text-surface-500 print:text-gray-500">Role(s):</span>{' '}
              <span className="font-medium">{member.roles.join(', ')}</span>
            </p>
            <p className="text-sm text-surface-700 print:text-gray-700">
              <span className="text-surface-500 print:text-gray-500">Period:</span>{' '}
              <span className="font-medium">{roster.period}</span>
            </p>
          </div>
        </div>

        {/* Duty list */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-surface-600 print:text-gray-600 uppercase tracking-wide mb-3">
            Assigned Duties ({duties.length})
          </h3>

          <table className="w-full text-sm border-collapse border border-surface-200 print:border-gray-400">
            <thead>
              <tr className="bg-surface-50 print:bg-gray-100">
                <th className="border border-surface-200 print:border-gray-400 px-3 py-2.5 text-left text-xs font-semibold text-surface-600 print:text-gray-700 uppercase tracking-wide w-8">
                  #
                </th>
                <th className="border border-surface-200 print:border-gray-400 px-3 py-2.5 text-left text-xs font-semibold text-surface-600 print:text-gray-700 uppercase tracking-wide">
                  Date
                </th>
                <th className="border border-surface-200 print:border-gray-400 px-3 py-2.5 text-left text-xs font-semibold text-surface-600 print:text-gray-700 uppercase tracking-wide">
                  Event
                </th>
                <th className="border border-surface-200 print:border-gray-400 px-3 py-2.5 text-left text-xs font-semibold text-surface-600 print:text-gray-700 uppercase tracking-wide">
                  Role
                </th>
                <th className="border border-surface-200 print:border-gray-400 px-3 py-2.5 text-center text-xs font-semibold text-surface-600 print:text-gray-700 uppercase tracking-wide w-12">
                  <span className="sr-only">Status</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {duties.map((duty, idx) => (
                <tr
                  key={idx}
                  className={cn(
                    idx % 2 === 0
                      ? 'bg-white'
                      : 'bg-surface-50/50 print:bg-gray-50'
                  )}
                >
                  <td className="border border-surface-200 print:border-gray-400 px-3 py-2 text-surface-400 print:text-gray-400 text-center">
                    {idx + 1}
                  </td>
                  <td className="border border-surface-200 print:border-gray-400 px-3 py-2 font-medium text-surface-800 print:text-black whitespace-nowrap">
                    {formatDate(duty.date, 'EEE, MMM d, yyyy')}
                  </td>
                  <td className="border border-surface-200 print:border-gray-400 px-3 py-2 text-surface-700 print:text-gray-700">
                    {duty.eventLabel}
                  </td>
                  <td className="border border-surface-200 print:border-gray-400 px-3 py-2 text-surface-700 print:text-gray-700">
                    {duty.role}
                  </td>
                  <td className="border border-surface-200 print:border-gray-400 px-3 py-2 text-center">
                    <CheckCircle2
                      size={16}
                      className="inline-block text-emerald-500 print:text-gray-700"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="bg-surface-50 print:bg-gray-50 rounded-lg p-4 mb-6 print:border print:border-gray-300">
          <p className="text-sm text-surface-700 print:text-gray-700">
            Total duties for <span className="font-semibold">{roster.period}</span>:{' '}
            <span className="text-lg font-bold text-primary-600 print:text-black">
              {duties.length}
            </span>
          </p>
        </div>

        {/* Signature */}
        <SignatureBlock
          lines={[
            { label: 'Member Acknowledgement' },
            { label: 'Team Lead Signature' },
            { label: 'Date' },
          ]}
          columns={1}
        />

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

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          [data-print-root], [data-print-root] * { visibility: visible; }
          [data-print-root] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>
    </div>
  );
}
