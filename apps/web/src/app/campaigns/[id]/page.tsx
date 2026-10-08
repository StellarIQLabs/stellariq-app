import { notFound } from 'next/navigation';
import { CampaignDetail } from '@/components/give/CampaignDetail';

export const metadata = { title: 'Campaign' };

export default function CampaignPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    notFound();
  }
  return (
    <main className="py-2 pb-10">
      <CampaignDetail id={id} />
    </main>
  );
}
