import clsx from 'clsx';

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}) {
  const Icon = icon;

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-100 mb-5">
          <Icon size={24} className="text-surface-400" />
        </div>
      )}

      {title && (
        <h3 className="text-base font-semibold text-surface-900 mb-1.5">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-sm text-surface-500 max-w-sm mb-6">
          {description}
        </p>
      )}

      {action && <div>{action}</div>}
    </div>
  );
}
