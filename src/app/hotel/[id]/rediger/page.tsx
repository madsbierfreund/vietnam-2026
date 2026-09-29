import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Topbar } from '@/components/Topbar';
import { kraevRedaktoer } from '@/lib/adgang';
import { HotelForm } from '@/components/forms/HotelForm';
import { hentTrip } from '@/lib/data';

export default async function RedigerHotel({ params }: { params: Promise<{ id: string }> }) {
  await kraevRedaktoer();
  const { id } = await params;
  const { data, fejl } = await hentTrip();
  const stay = data?.stays.find((s) => s.id === id);
  if (data && !stay) notFound();
  return (
    <>
      <Topbar />
      <main className="frame side">
        <Link href={`/hotel/${id}`} className="brodkrumme">
          ← Tilbage
        </Link>
        <h1>Ret hotel</h1>
        {fejl !== null ? <p className="fejl">{fejl}</p> : <HotelForm destinations={data.destinations} stay={stay} />}
      </main>
    </>
  );
}
