import type { ReactNode } from 'react';

// Minimal root layout so the Next.js toolchain compiles.
// The full dashboard shell lands in the scaffold-web task.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
