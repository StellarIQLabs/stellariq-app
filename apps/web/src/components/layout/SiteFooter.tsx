export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border py-6 text-sm text-muted">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 md:flex-row md:items-center md:justify-between">
        <p>
          <span className="font-semibold text-text">StellarIQ Give</span> - transparent charity
          donations on Stellar.
        </p>
        <p className="font-mono text-xs">Testnet demo. Never share your secret key.</p>
      </div>
    </footer>
  );
}
