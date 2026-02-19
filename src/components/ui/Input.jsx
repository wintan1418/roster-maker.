import { forwardRef, useId } from 'react';
import clsx from 'clsx';

const Input = forwardRef(function Input(
  {
    label,
    helperText,
    error,
    iconLeft,
    iconRight,
    className,
    wrapperClassName,
    id: externalId,
    ...props
  },
  ref
) {
  const internalId = useId();
  const id = externalId || internalId;

  const IconLeft = iconLeft;
  const IconRight = iconRight;

  return (
    <div className={clsx('w-full', wrapperClassName)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-surface-700 mb-1.5"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {IconLeft && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <IconLeft
              size={16}
              className={clsx(
                'transition-colors duration-200',
                error ? 'text-error' : 'text-surface-400'
              )}
            />
          </div>
        )}

        <input
          ref={ref}
          id={id}
          className={clsx(
            'block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-surface-900',
            'placeholder:text-surface-400',
            'transition-all duration-200 ease-in-out',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-error/50 focus:border-error focus:ring-error/25'
              : 'border-surface-300 focus:border-primary-500 focus:ring-primary-500/25',
            'disabled:bg-surface-50 disabled:text-surface-400 disabled:cursor-not-allowed',
            IconLeft && 'pl-10',
            IconRight && 'pr-10',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
          {...props}
        />

        {IconRight && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <IconRight
              size={16}
              className={clsx(
                'transition-colors duration-200',
                error ? 'text-error' : 'text-surface-400'
              )}
            />
          </div>
        )}
      </div>

      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={`${id}-helper`} className="mt-1.5 text-sm text-surface-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
