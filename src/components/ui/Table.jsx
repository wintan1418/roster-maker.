import { forwardRef, useState, useCallback } from 'react';
import clsx from 'clsx';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

const Table = forwardRef(function Table(
  { children, className, ...props },
  ref
) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-surface-200">
      <table
        ref={ref}
        className={clsx('w-full text-sm', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
});

function TableHead({ children, className, ...props }) {
  return (
    <thead
      className={clsx('bg-surface-50 border-b border-surface-200', className)}
      {...props}
    >
      {children}
    </thead>
  );
}

function TableBody({ children, className, ...props }) {
  return (
    <tbody
      className={clsx('divide-y divide-surface-100', className)}
      {...props}
    >
      {children}
    </tbody>
  );
}

function TableRow({ children, className, clickable = false, ...props }) {
  return (
    <tr
      className={clsx(
        'transition-colors duration-200',
        'even:bg-surface-50/50',
        clickable && 'cursor-pointer hover:bg-primary-50/50',
        !clickable && 'hover:bg-surface-50',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

function TableHeaderCell({
  children,
  className,
  sortable = false,
  sorted,
  onSort,
  align = 'left',
  ...props
}) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  const handleSort = useCallback(() => {
    if (sortable && onSort) {
      onSort();
    }
  }, [sortable, onSort]);

  const SortIcon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown;

  return (
    <th
      className={clsx(
        'px-4 py-3 text-xs font-semibold tracking-wide text-surface-500 uppercase',
        alignClass,
        sortable && 'cursor-pointer select-none hover:text-surface-700 transition-colors duration-200',
        className
      )}
      onClick={sortable ? handleSort : undefined}
      {...props}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        {sortable && (
          <SortIcon
            size={14}
            className={clsx(
              'transition-colors duration-200',
              sorted ? 'text-primary-500' : 'text-surface-300'
            )}
          />
        )}
      </span>
    </th>
  );
}

function TableCell({ children, className, align = 'left', ...props }) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <td
      className={clsx(
        'px-4 py-3 text-surface-700',
        alignClass,
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

/**
 * Hook for managing table sort state.
 * Returns [{ key, direction }, requestSort] where requestSort(key) toggles sort.
 */
export function useTableSort(defaultKey = null, defaultDirection = 'asc') {
  const [sortConfig, setSortConfig] = useState({
    key: defaultKey,
    direction: defaultDirection,
  });

  const requestSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  return [sortConfig, requestSort];
}

Table.Head = TableHead;
Table.Body = TableBody;
Table.Row = TableRow;
Table.HeaderCell = TableHeaderCell;
Table.Cell = TableCell;

export default Table;
