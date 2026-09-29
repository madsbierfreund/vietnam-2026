import Link from 'next/link';
import { Topbar } from '@/components/Topbar';
import { kraevRedaktoer } from '@/lib/adgang';
import { HotelForm } from '@/components/forms/HotelForm';
import { hentTrip } from '@/lib/data';

export default async function NytHotel() {
  await kraevRedaktoer();
  const { data, fejl } = await hentTrip();
  return (
    <>
      <Topbar aktiv="hotel" />
      <main className="frame side">
        <Link href="/" className="brodkrumme">
          ← Oversigt
        </Link>
        <h1>Nyt hotel</h1>
        {fejl !== null ? <p className="fejl">{fejl}</p> : <HotelForm destinations={data.destinations} />}
      </main>
    </>
  );
}
