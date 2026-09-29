import Link from 'next/link';
import { Topbar } from '@/components/Topbar';
import { AktivitetForm } from '@/components/forms/AktivitetForm';
import { hentTrip } from '@/lib/data';

export default async function NyAktivitet({ searchParams }: { searchParams: Promise<{ destination?: string }> }) {
  const { destination } = await searchParams;
  const { data, fejl } = await hentTrip();
  return (
    <>
      <Topbar />
      <main className="frame side">
        <Link href="/" className="brodkrumme">
          ← Oversigt
        </Link>
        <h1>Ny aktivitet</h1>
        {fejl !== null ? (
          <p className="fejl">{fejl}</p>
        ) : (
          <AktivitetForm destinations={data.destinations} stays={data.stays} forvalgtDestinationId={destination} />
        )}
      </main>
    </>
  );
}
