import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Topbar } from '@/components/Topbar';
import { StatusChip } from '@/components/StatusChip';
import { SletKnap } from '@/components/SletKnap';
import { MiniMap } from '@/components/maps/MiniMap';
import { sletHotel } from '@/app/actions';
import { hentTrip } from '@/lib/data';
import { hentAdgang } from '@/lib/adgang';
import { formatDate, formatDateRange, nights, nightsLabel } from '@/lib/trip/dates';
import { splitActivities } from '@/lib/trip/activities';

export default async function HotelSide({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ data, fejl }, { kanRedigere }] = await Promise.all([hentTrip(), hentAdgang()]);
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
  const stay = data.stays.find((s) => s.id === id);
  if (!stay) notFound();
  const destination = data.destinations.find((d) => d.id === stay.destination_id);
  const { planlagt, oensker } = splitActivities(data.activities.filter((a) => a.destination_id === stay.destination_id));
  const slet = sletHotel.bind(null, stay.id);

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
            {destination?.area ? ` · ${destination.area}` : ''}
          </p>
          <h1>{stay.name}</h1>
        </div>
        <div className="linje num">
          <span>{formatDateRange(stay.check_in, stay.check_out)}</span>
          <span className="muted">{nightsLabel(nights(stay))}</span>
          <StatusChip status={stay.status} />
        </div>

        <div className="detalje-kort">
          <MiniMap lat={stay.lat} lng={stay.lng} farve={destination?.color ?? '#6b6862'} titel={stay.name} />
        </div>
        {stay.google_maps_url ? (
          <a href={stay.google_maps_url} target="_blank" rel="noreferrer">
            Åbn i Google Maps
          </a>
        ) : null}

        {stay.description ? <p className="beskrivelse">{stay.description}</p> : null}

        <dl className="fakta">
          <dt>Værelser</dt>
          <dd>{stay.room_setup || '—'}</dd>
          <dt>Afbestilling</dt>
          <dd>{stay.cancellation_note || '—'}</dd>
          <dt>Links</dt>
          <dd className="btn-row">
            {stay.website_url ? (
              <a href={stay.website_url} target="_blank" rel="noreferrer">
                Hotellets hjemmeside
              </a>
            ) : null}
            {stay.extra_url ? (
              <a href={stay.extra_url} target="_blank" rel="noreferrer">
                {stay.extra_url_label || stay.extra_url}
              </a>
            ) : stay.extra_url_label ? (
              <span className="muted">{stay.extra_url_label}: link mangler</span>
            ) : null}
            {!stay.website_url && !stay.extra_url && !stay.extra_url_label ? '—' : null}
          </dd>
        </dl>

        {kanRedigere ? (
          <div className="btn-row">
            <Link href={`/hotel/${stay.id}/rediger`} className="btn">
              Ret
            </Link>
            <SletKnap handling={slet} hvad={`hotellet "${stay.name}"`} />
          </div>
        ) : null}

        <section className="destination">
          <h2>Aktiviteter i {destination?.name}</h2>
          <div className="akt-gruppe">
            <h3>Planlagt</h3>
            {planlagt.length === 0 ? <p className="tom">Intet planlagt endnu.</p> : null}
            <ul className="akt-liste">
              {planlagt.map((a) => (
                <li key={a.id}>
                  <Link href={`/aktivitet/${a.id}`}>
                    <span className="hvornaar num">
                      {formatDate(a.date!, true)}
                      {a.time_of_day ? `, ${a.time_of_day}` : ''}
                    </span>
                    <span className="titel">{a.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="akt-gruppe">
            <h3>Ønsker</h3>
            {oensker.length === 0 ? <p className="tom">Ingen ønsker endnu.</p> : null}
            <ul className="akt-liste">
              {oensker.map((a) => (
                <li key={a.id}>
                  <Link href={`/aktivitet/${a.id}`}>
                    <span className="titel">{a.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {kanRedigere ? (
            <div>
              <Link href={`/aktivitet/ny?destination=${stay.destination_id}`} className="btn btn-small">
                + Aktivitet i {destination?.name}
              </Link>
            </div>
          ) : null}
        </section>
      </main>
    </>
  );
}
