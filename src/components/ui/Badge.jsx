import clsx from 'clsx';

const colorVariants = {
  default:
    'bg-surface-100 text-surface-700 ring-surface-200',
  primary:
    'bg-primary-50 text-primary-700 ring-primary-200',
  success:
    'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning:
    'bg-amber-50 text-amber-700 ring-amber-200',
  error:
    'bg-red-50 text-red-700 ring-red-200',
  info:
    'bg-sky-50 text-sky-700 ring-sky-200',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({
  children,
  color = 'default',
  size = 'sm',
  dot = false,
  className,
  ...props
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full ring-1 ring-inset',
        'transition-colors duration-200',
        colorVariants[color],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full', {
            'bg-surface-500': color === 'default',
            'bg-primary-500': color === 'primary',
            'bg-emerald-500': color === 'success',
            'bg-amber-500': color === 'warning',
            'bg-red-500': color === 'error',
            'bg-sky-500': color === 'info',
          })}
        />
      )}
      {children}
    </span>
  );
}
