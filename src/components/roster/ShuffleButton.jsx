import { useState, useRef, useEffect } from 'react';
import { Shuffle, ChevronDown, Sparkles, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import Button from '@/components/ui/Button';

/**
 * ShuffleButton - Dropdown with shuffle options.
 *
 * Actions:
 *   - Shuffle All: Clear auto-assignments and re-shuffle
 *   - Shuffle Empty Only: Only fill empty cells
 *   - Clear Auto-Assignments: Remove all auto assignments
 */
export default function ShuffleButton({
  onShuffleAll,
  onShuffleEmpty,
  onClearAuto,
  isShuffling = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = (action) => {
    setIsOpen(false);
    action?.();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center">
        {/* Main shuffle button */}
        <Button
          variant="primary"
          size="sm"
          loading={isShuffling}
          onClick={() => handleAction(onShuffleAll)}
          className="rounded-r-none"
          iconLeft={Shuffle}
        >
          <span className="hidden sm:inline">Shuffle</span>
        </Button>

        {/* Dropdown trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isShuffling}
          className={clsx(
            'h-8 px-1.5 rounded-r-md border-l border-primary-700',
            'bg-primary-600 text-white hover:bg-primary-700',
            'transition-colors duration-200 cursor-pointer',
            'disabled:opacity-50 disabled:pointer-events-none',
            'flex items-center justify-center'
          )}
        >
          <ChevronDown
            size={14}
            className={clsx(
              'transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={clsx(
            'absolute z-50 right-0 top-full mt-1.5',
            'w-56 py-1.5',
            'bg-white rounded-xl border border-surface-200 shadow-xl'
          )}
          style={{ animation: 'dropdownIn 0.15s ease-out' }}
        >
          <button
            onClick={() => handleAction(onShuffleAll)}
            className={clsx(
              'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm',
              'text-surface-700 hover:bg-surface-50',
              'transition-colors duration-150 cursor-pointer'
            )}
          >
            <Shuffle size={15} className="text-primary-500 flex-shrink-0" />
            <div>
              <p className="font-medium">Shuffle All</p>
              <p className="text-xs text-surface-400 mt-0.5">
                Re-shuffle all non-pinned slots
              </p>
            </div>
          </button>

          <button
            onClick={() => handleAction(onShuffleEmpty)}
            className={clsx(
              'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm',
              'text-surface-700 hover:bg-surface-50',
              'transition-colors duration-150 cursor-pointer'
            )}
          >
            <Sparkles size={15} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-medium">Shuffle Empty Only</p>
              <p className="text-xs text-surface-400 mt-0.5">
                Only fill unassigned cells
              </p>
            </div>
          </button>

          <div className="my-1.5 border-t border-surface-100" />

          <button
            onClick={() => handleAction(onClearAuto)}
            className={clsx(
              'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm',
              'text-red-600 hover:bg-red-50',
              'transition-colors duration-150 cursor-pointer'
            )}
          >
            <Trash2 size={15} className="flex-shrink-0" />
            <div>
              <p className="font-medium">Clear Auto-Assignments</p>
              <p className="text-xs text-red-400 mt-0.5">
                Remove all shuffled assignments
              </p>
            </div>
          </button>
        </div>
      )}

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
