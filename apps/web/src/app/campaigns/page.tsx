import { redirect } from 'next/navigation';

// Campaigns are listed on the home page; keep breadcrumb links working.
export default function Page() {
  redirect('/');
}
