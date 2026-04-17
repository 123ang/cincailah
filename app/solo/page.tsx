import type { Metadata } from 'next';
import SoloPage from '@/components/SoloPage';

export const metadata: Metadata = {
  title: 'Solo Spin — Cincailah',
  description:
    'Decide what to eat in 3 seconds. No signup needed — spin, pick a favorite, or filter by cuisine.',
};

export default function Page() {
  return <SoloPage />;
}
