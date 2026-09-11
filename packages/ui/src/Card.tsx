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
    <section
      className={clsx('rounded-lg border border-border bg-surface p-5 shadow-sm', className)}
    >
      {(title ?? action) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {typeof title === 'string' ? (
              <h2 className="text-base font-semibold text-text">{title}</h2>
            ) : (
              title
            )}
            {typeof subtitle === 'string' ? (
              <p className="mt-1 text-sm text-muted">{subtitle}</p>
            ) : (
              subtitle
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
