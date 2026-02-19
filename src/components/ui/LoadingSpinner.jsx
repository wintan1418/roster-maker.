import clsx from 'clsx';

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
  xl: 'h-12 w-12 border-[3px]',
};

export default function LoadingSpinner({
  size = 'md',
  className,
  ...props
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={clsx(
        'rounded-full border-primary-200 border-t-primary-600 animate-spin',
        sizes[size],
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingOverlay({
  label = 'Loading...',
  className,
}) {
  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        'bg-white/80 backdrop-blur-sm',
        className
      )}
    >
      <LoadingSpinner size="xl" />
      {label && (
        <p className="mt-4 text-sm font-medium text-surface-600">{label}</p>
      )}
    </div>
  );
}

export function LoadingBlock({
  label,
  size = 'lg',
  className,
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center py-16',
        className
      )}
    >
      <LoadingSpinner size={size} />
      {label && (
        <p className="mt-3 text-sm text-surface-500">{label}</p>
      )}
    </div>
  );
}
