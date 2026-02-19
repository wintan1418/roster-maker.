import { cn } from '@/lib/utils';

/**
 * Reusable print-ready signature block.
 *
 * @param {Object}   props
 * @param {Array<{label: string, value?: string}>} props.lines - signature line definitions
 * @param {number}   [props.columns=2] - how many columns to lay the lines out in
 * @param {string}   [props.className]
 */
export default function SignatureBlock({
  lines = [
    { label: 'Prepared by' },
    { label: 'Approved by' },
    { label: 'Team Lead Signature' },
    { label: "Pastor's Signature" },
    { label: 'Date' },
  ],
  columns = 2,
  className,
}) {
  return (
    <div
      className={cn(
        'mt-10 pt-8 border-t border-surface-200 print:border-gray-300',
        className
      )}
    >
      <div
        className={cn(
          'grid gap-x-12 gap-y-8',
          columns === 1 && 'grid-cols-1',
          columns === 2 && 'grid-cols-1 sm:grid-cols-2',
          columns === 3 && 'grid-cols-1 sm:grid-cols-3'
        )}
      >
        {lines.map((line, idx) => (
          <div key={idx} className="flex flex-col">
            {/* The signature line itself */}
            <div className="flex items-end gap-2 min-h-[2rem]">
              {line.value && (
                <span className="text-sm text-surface-800 print:text-gray-900 font-medium">
                  {line.value}
                </span>
              )}
            </div>
            <div className="border-b border-surface-400 print:border-gray-500 mt-1" />
            <span className="mt-1.5 text-xs text-surface-500 print:text-gray-500 font-medium">
              {line.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
