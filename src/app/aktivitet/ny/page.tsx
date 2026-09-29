import Link from 'next/link';
import { Topbar } from '@/components/Topbar';
import { kraevRedaktoer } from '@/lib/adgang';
import { AktivitetForm } from '@/components/forms/AktivitetForm';
import { hentTrip } from '@/lib/data';
import { foersteRejsedag } from '@/lib/trip/activities';

export default async function NyAktivitet({ searchParams }: { searchParams: Promise<{ destination?: string; dato?: string }> }) {
  await kraevRedaktoer();
  const { destination, dato } = await searchParams;
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
          <AktivitetForm destinations={data.destinations} stays={data.stays} foersteDag={foersteRejsedag(data.transport)} forvalgtDestinationId={destination}
            forvalgtDato={dato && /^\d{4}-\d{2}-\d{2}$/.test(dato) ? dato : undefined}
          />
        )}
      </main>
    </>
  );
}
