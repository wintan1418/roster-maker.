import { forwardRef } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500 shadow-sm',
  secondary:
    'bg-surface-100 text-surface-700 hover:bg-surface-200 active:bg-surface-300 focus-visible:ring-surface-400 shadow-sm',
  outline:
    'border border-surface-300 text-surface-700 hover:bg-surface-50 active:bg-surface-100 focus-visible:ring-primary-500',
  ghost:
    'text-surface-600 hover:bg-surface-100 active:bg-surface-200 focus-visible:ring-primary-500',
  danger:
    'bg-error text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-red-500 shadow-sm',
};

const sizes = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-lg',
};

const iconOnlySizes = {
  sm: 'h-8 w-8 rounded-md',
  md: 'h-10 w-10 rounded-lg',
  lg: 'h-12 w-12 rounded-lg',
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    iconLeft,
    iconRight,
    fullWidth = false,
    className,
    ...props
  },
  ref
) {
  const isIconOnly = !children && (iconLeft || iconRight);
  const isDisabled = disabled || loading;

  const IconLeft = iconLeft;
  const IconRight = iconRight;

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        'select-none cursor-pointer',
        variants[variant],
        isIconOnly ? iconOnlySizes[size] : sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2
          size={iconSize}
          className="animate-spin shrink-0"
        />
      ) : (
        IconLeft && <IconLeft size={iconSize} className="shrink-0" />
      )}

      {children && <span className={clsx(loading && 'ml-0')}>{children}</span>}

      {!loading && IconRight && (
        <IconRight size={iconSize} className="shrink-0" />
      )}
    </button>
  );
});

export default Button;
