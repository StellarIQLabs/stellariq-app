'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECTION_LABELS: Record<string, string> = {
  markets: 'Markets',
  assets: 'Assets',
  pools: 'Pools',
  swap: 'Swap',
};

/** Breadcrumb trail derived from the current route, wrapping every page. */
export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return null;
  }
  const crumbs = segments.map((segment, i) => {
    const href = `/${segments.slice(0, i + 1).join('/')}`;
    const label = SECTION_LABELS[segment] ?? decodeURIComponent(segment);
    const isLast = i === segments.length - 1;
    return { href, label, isLast };
  });
  return (
    <nav aria-label="Breadcrumb" className="py-3 text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-muted">
        <li>
          <Link href="/" className="hover:text-text">
            Home
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <span aria-hidden="true">/</span>
            {crumb.isLast ? (
              <span aria-current="page" className="font-medium text-text">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="hover:text-text">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
