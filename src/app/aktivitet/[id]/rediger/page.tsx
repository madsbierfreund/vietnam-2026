import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Topbar } from '@/components/Topbar';
import { kraevRedaktoer } from '@/lib/adgang';
import { AktivitetForm } from '@/components/forms/AktivitetForm';
import { hentTrip } from '@/lib/data';
import { foersteRejsedag } from '@/lib/trip/activities';

export default async function RedigerAktivitet({ params }: { params: Promise<{ id: string }> }) {
  await kraevRedaktoer();
  const { id } = await params;
  const { data, fejl } = await hentTrip();
  const activity = data?.activities.find((a) => a.id === id);
  if (data && !activity) notFound();
  return (
    <>
      <Topbar />
      <main className="frame side">
        <Link href={`/aktivitet/${id}`} className="brodkrumme">
          ← Tilbage
        </Link>
        <h1>Ret aktivitet</h1>
        {fejl !== null ? (
          <p className="fejl">{fejl}</p>
        ) : (
          <AktivitetForm destinations={data.destinations} stays={data.stays} foersteDag={foersteRejsedag(data.transport)} activity={activity} />
        )}
      </main>
    </>
  );
}
