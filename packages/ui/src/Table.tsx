import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyOf: (row: T) => string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyMessage?: string;
  className?: string;
}

const alignClasses = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

export function Table<T>({
  columns,
  rows,
  keyOf,
  sortKey,
  sortDir,
  onSort,
  emptyMessage = 'No data available.',
  className,
}: TableProps<T>) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{emptyMessage}</p>;
  }
  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'px-3 py-2 font-medium uppercase tracking-wide text-xs',
                  alignClasses[col.align ?? 'left'],
                )}
              >
                {col.sortable && onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort(col.key)}
                    className="inline-flex items-center gap-1 hover:text-text"
                  >
                    {col.header}
                    {sortKey === col.key && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyOf(row)} className="border-b border-border/50 hover:bg-surface-raised/40">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx('px-3 py-2.5', alignClasses[col.align ?? 'left'])}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
