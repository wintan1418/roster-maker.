import { useState, useCallback } from 'react';
import {
  Printer,
  Image,
  FileText,
  User,
  Users,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

/**
 * Download format picker -- lets users choose between Print/PDF and Image,
 * and toggle between General Roster and Personal Schedule.
 *
 * @param {Object}   props
 * @param {Object}   props.organization      - { name }
 * @param {Function} props.onSelectPDF       - called when print/pdf chosen
 * @param {Function} props.onSelectImage     - called when image chosen
 * @param {string}   [props.scheduleType]    - 'roster' | 'personal' (controlled)
 * @param {Function} [props.onTypeChange]    - (type) => void
 * @param {string}   [props.className]
 */
export default function DownloadOptions({
  organization,
  onSelectPDF,
  onSelectImage,
  scheduleType: controlledType,
  onTypeChange,
  className,
}) {
  const [internalType, setInternalType] = useState('roster');
  const scheduleType = controlledType ?? internalType;

  const handleTypeChange = useCallback(
    (type) => {
      setInternalType(type);
      onTypeChange?.(type);
    },
    [onTypeChange]
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Organization branding preview */}
      <div className="flex items-center gap-3 p-4 bg-surface-50 rounded-xl border border-surface-200">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-500 text-white font-bold text-sm shrink-0">
          {organization.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-surface-900 truncate">
            {organization.name}
          </p>
          <p className="text-xs text-surface-500">
            Download or print your roster
          </p>
        </div>
      </div>

      {/* Toggle: General Roster vs Personal Schedule */}
      <div>
        <p className="text-sm font-medium text-surface-700 mb-2">
          What would you like to download?
        </p>
        <div className="grid grid-cols-2 gap-2 p-1 bg-surface-100 rounded-lg">
          <button
            type="button"
            className={cn(
              'flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer',
              scheduleType === 'roster'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            )}
            onClick={() => handleTypeChange('roster')}
          >
            <Users size={16} />
            General Roster
          </button>
          <button
            type="button"
            className={cn(
              'flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer',
              scheduleType === 'personal'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            )}
            onClick={() => handleTypeChange('personal')}
          >
            <User size={16} />
            Personal Schedule
          </button>
        </div>
      </div>

      {/* Format options */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Print / PDF option */}
        <Card
          hover
          className="cursor-pointer group"
          onClick={onSelectPDF}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectPDF?.();
            }
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 mb-4 group-hover:bg-primary-100 transition-colors">
              <Printer size={24} className="text-primary-600" />
            </div>
            <h3 className="text-base font-semibold text-surface-900">
              Print / PDF
            </h3>
            <p className="text-sm text-surface-500 mt-1 mb-3">
              Open the print dialog to print or save as a PDF file
            </p>
            <Badge color="success" size="sm">
              <FileText size={12} />
              Ready
            </Badge>
          </div>
          <div className="flex items-center justify-center gap-1 mt-4 pt-4 border-t border-surface-100 text-sm text-primary-600 font-medium group-hover:gap-2 transition-all">
            Open Print Preview
            <ChevronRight size={14} />
          </div>
        </Card>

        {/* Image option */}
        <Card
          hover
          className="cursor-pointer group"
          onClick={onSelectImage}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectImage?.();
            }
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 mb-4 group-hover:bg-amber-100 transition-colors">
              <Image size={24} className="text-amber-600" />
            </div>
            <h3 className="text-base font-semibold text-surface-900">
              Save as Image
            </h3>
            <p className="text-sm text-surface-500 mt-1 mb-3">
              View a styled roster image you can screenshot or share
            </p>
            <Badge color="info" size="sm">
              <Image size={12} />
              Preview
            </Badge>
          </div>
          <div className="flex items-center justify-center gap-1 mt-4 pt-4 border-t border-surface-100 text-sm text-amber-600 font-medium group-hover:gap-2 transition-all">
            View Styled Preview
            <ChevronRight size={14} />
          </div>
        </Card>
      </div>
    </div>
  );
}
