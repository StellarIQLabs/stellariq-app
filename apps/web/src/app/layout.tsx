import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import './globals.css';

export const metadata = {
  title: {
    default: 'StellarIQ - Intelligence for Stellar DeFi',
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-text antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
