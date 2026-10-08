import { notFound } from 'next/navigation';
import { ReceiptView } from '@/components/give/ReceiptView';

export const metadata = { title: 'Donation receipt' };

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    notFound();
  }
  return (
    <main className="py-6 pb-10">
      <ReceiptView id={id} />
    </main>
  );
}
