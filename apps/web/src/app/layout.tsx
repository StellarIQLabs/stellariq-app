import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import './globals.css';

export const metadata = {
  title: {
    default: 'StellarIQ — Intelligence for Stellar DeFi',
    template: '%s · StellarIQ',
  },
  description:
    'Asset prices, DEX markets, pool analytics and best-execution swaps for Stellar DeFi.',
};

// Global layout: header, sidebar, mobile shell, breadcrumbs and footer wrap
// every page via AppShell.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-text antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
