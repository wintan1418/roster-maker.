import { forwardRef } from 'react';
import clsx from 'clsx';

const Card = forwardRef(function Card(
  {
    children,
    className,
    hover = false,
    noPadding = false,
    ...props
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={clsx(
        'bg-white rounded-xl border border-surface-200 shadow-sm',
        'transition-all duration-200 ease-in-out',
        hover && 'hover:shadow-md hover:border-surface-300 hover:-translate-y-0.5',
        !noPadding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between pb-4 mb-4 border-b border-surface-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardTitle({ children, className, ...props }) {
  return (
    <h3
      className={clsx('text-lg font-semibold text-surface-900', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

function CardDescription({ children, className, ...props }) {
  return (
    <p
      className={clsx('text-sm text-surface-500 mt-1', className)}
      {...props}
    >
      {children}
    </p>
  );
}

function CardBody({ children, className, ...props }) {
  return (
    <div className={clsx(className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        'flex items-center justify-end gap-3 pt-4 mt-4 border-t border-surface-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
