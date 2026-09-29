import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Topbar } from '@/components/Topbar';
import { kraevRedaktoer } from '@/lib/adgang';
import { SletKnap } from '@/components/SletKnap';
import { TransportForm } from '@/components/forms/TransportForm';
import { sletTransport } from '@/app/actions';
import { hentRaekke } from '@/lib/data';
import type { Transport } from '@/lib/types';

export default async function RedigerTransport({ params }: { params: Promise<{ id: string }> }) {
  await kraevRedaktoer();
  const { id } = await params;
  const { data, fejl } = await hentRaekke<Transport>('transport', id);
  if (!fejl && !data) notFound();
  return (
    <>
      <Topbar />
      <main className="frame side">
        <Link href="/" className="brodkrumme">
          ← Oversigt
        </Link>
        <h1>Ret transport</h1>
        {fejl !== null ? (
          <p className="fejl">{fejl}</p>
        ) : (
          <>
            <TransportForm transport={data!} />
            <div className="btn-row">
              <SletKnap handling={sletTransport.bind(null, id)} hvad="denne transport" />
            </div>
          </>
        )}
      </main>
    </>
  );
}
