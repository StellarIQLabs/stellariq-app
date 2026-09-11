'use client';

import { useEffect } from 'react';
import { Button } from '@stellariq/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-col items-start gap-4 py-16">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-sm text-muted">
        Market data failed to load. Check your connection and try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
