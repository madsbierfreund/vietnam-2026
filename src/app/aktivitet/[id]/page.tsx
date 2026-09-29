import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Topbar } from '@/components/Topbar';
import { SletKnap } from '@/components/SletKnap';
import { MiniMap } from '@/components/maps/MiniMap';
import { sletAktivitet } from '@/app/actions';
import { hentTrip } from '@/lib/data';
import { formatDate } from '@/lib/trip/dates';
import { formatDkk } from '@/lib/trip/prices';

export default async function AktivitetSide({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, fejl } = await hentTrip();
  if (fejl !== null) {
    return (
      <>
        <Topbar />
        <main className="frame side">
          <p className="fejl">{fejl}</p>
        </main>
      </>
    );
  }
  const a = data.activities.find((x) => x.id === id);
  if (!a) notFound();
  const destination = data.destinations.find((d) => d.id === a.destination_id);
  const slet = sletAktivitet.bind(null, a.id);

  return (
    <>
      <Topbar />
      <main className="frame side">
        <Link href="/" className="brodkrumme">
          ← Oversigt
        </Link>
        <div>
          <p className="muted small" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span className="swatch" style={{ background: destination?.color }} />
            {destination?.name}
          </p>
          <h1>{a.title}</h1>
        </div>

        <dl className="fakta">
          <dt>Hvornår</dt>
          <dd className="num">
            {a.date ? `${formatDate(a.date, true)}${a.time_of_day ? `, ${a.time_of_day}` : ''}` : 'Ikke lagt på en dag (ønske)'}
          </dd>
          <dt>Pris</dt>
          <dd className="num">{formatDkk(a.price_dkk)}</dd>
          <dt>Link</dt>
          <dd>
            {a.url ? (
              <a href={a.url} target="_blank" rel="noreferrer">
                {a.url}
              </a>
            ) : (
              '—'
            )}
          </dd>
        </dl>

        {a.description ? <p className="beskrivelse">{a.description}</p> : null}

        <div className="detalje-kort">
          <MiniMap lat={a.lat} lng={a.lng} farve={destination?.color ?? '#6b6862'} titel={a.title} />
        </div>
        {a.google_maps_url ? (
          <a href={a.google_maps_url} target="_blank" rel="noreferrer">
            Åbn i Google Maps
          </a>
        ) : null}

        <div className="btn-row">
          <Link href={`/aktivitet/${a.id}/rediger`} className="btn">
            Ret
          </Link>
          <SletKnap handling={slet} hvad={`aktiviteten "${a.title}"`} />
        </div>
      </main>
    </>
  );
}
