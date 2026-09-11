'use client';

import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { SiteHeader } from './SiteHeader';
import { SideNav } from './SideNav';
import { Breadcrumbs } from './Breadcrumbs';
import { SiteFooter } from './SiteFooter';

/**
 * Responsive application shell: sticky header, collapsible sidebar drawer on
 * mobile, persistent sidebar on desktop, breadcrumbs and footer on every page.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader onMenuClick={() => setDrawerOpen(true)} />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4">
        <aside className="hidden w-56 shrink-0 py-6 md:block" aria-label="Sidebar">
          <div className="sticky top-24">
            <SideNav />
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <Breadcrumbs />
          {children}
        </div>
      </div>
      <SiteFooter />
      <div
        className={clsx(
          'fixed inset-0 z-40 md:hidden',
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!drawerOpen}
      >
        <div
          className={clsx(
            'absolute inset-0 bg-black/60 transition-opacity',
            drawerOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={clsx(
            'absolute left-0 top-0 h-full w-64 bg-surface p-4 transition-transform',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          aria-label="Mobile navigation"
        >
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
            className="mb-4 rounded-md p-2 text-muted hover:bg-surface-raised hover:text-text"
          >
            ✕
          </button>
          <SideNav onNavigate={() => setDrawerOpen(false)} />
        </aside>
      </div>
    </div>
  );
}
