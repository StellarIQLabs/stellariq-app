import { CampaignList } from '@/components/give/CampaignList';
import { GiveStats } from '@/components/give/GiveStats';
import { RecentDonations } from '@/components/give/RecentDonations';

export const metadata = { title: 'Campaigns' };

// StellarIQ Give home: live campaigns read from the donations contract, with
// totals and the latest on-chain receipts.
export default function GivePage() {
  return (
    <main className="flex flex-col gap-6 py-2 pb-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-positive">
          StellarIQ Give
        </p>
        <h1 className="mt-1 text-3xl font-bold">Transparent giving on Stellar</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Every donation goes straight to the charity&apos;s wallet and leaves a public receipt on
          the Stellar network. No middleman holds your money, and anyone can verify where it went.
        </p>
      </header>
      <GiveStats />
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Open campaigns</h2>
        <CampaignList />
      </section>
      <RecentDonations />
      <section className="grid gap-3 rounded-lg border border-border bg-surface p-4 text-sm sm:grid-cols-3">
        <Step
          n={1}
          title="Pick a campaign"
          body="Each campaign has a goal, a deadline and a verified charity wallet."
        />
        <Step
          n={2}
          title="Donate from your wallet"
          body="Freighter, Albedo, xBull and more. Sign once; funds move directly to the charity."
        />
        <Step
          n={3}
          title="Get a receipt"
          body="Your donation is recorded on-chain with a receipt anyone can check."
        />
      </section>
    </main>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-positive/15 font-mono text-positive">
        {n}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-muted">{body}</p>
      </div>
    </div>
  );
}
