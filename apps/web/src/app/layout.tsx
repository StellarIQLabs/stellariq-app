import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: {
    default: 'StellarIQ — Intelligence for Stellar DeFi',
    template: '%s · StellarIQ',
  },
  description:
    'Asset prices, DEX markets, pool analytics and best-execution swaps for Stellar DeFi.',
};

// Base application shell. The full header/sidebar navigation lands in the
// global-layout task; this establishes the document structure every page shares.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-text antialiased">
        <div id="app-shell" className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4">
          {children}
        </div>
      </body>
    </html>
  );
}
