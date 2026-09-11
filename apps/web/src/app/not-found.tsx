import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-col items-start gap-4 py-16">
      <h1 className="text-2xl font-bold">Not found</h1>
      <p className="text-sm text-muted">This asset, market or pool is not indexed yet.</p>
      <Link
        className="rounded-md border border-border px-4 py-2 text-sm hover:border-accent"
        href="/"
      >
        Back to overview
      </Link>
    </main>
  );
}
