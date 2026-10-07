import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, subtitle, action, children, className }: CardProps) {
  return (
    <section className={clsx('rounded-md border border-border bg-surface', className)}>
      {(title ?? action) && (
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-2.5">
          <div>
            {typeof title === 'string' ? (
              <h2 className="text-sm font-semibold text-text">{title}</h2>
            ) : (
              title
            )}
            {typeof subtitle === 'string' ? (
              <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
            ) : (
              subtitle
            )}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
