'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

export interface NavItem {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Overview', match: (p) => p === '/' },
  { href: '/markets', label: 'Markets', match: (p) => p.startsWith('/markets') },
  { href: '/assets', label: 'Assets', match: (p) => p.startsWith('/assets') },
  { href: '/pools', label: 'Pools', match: (p) => p.startsWith('/pools') },
  { href: '/swap', label: 'Swap', match: (p) => p.startsWith('/swap') },
];

export function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            {...(onNavigate ? { onClick: onNavigate } : {})}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-accent/15 text-accent'
                : 'text-muted hover:bg-surface-raised hover:text-text',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
