import Link from 'next/link';
import type { Activity, Destination, Stay } from '@/lib/types';
import { formatDate, formatDateRange, nights, nightsLabel } from '@/lib/trip/dates';
import { splitActivities } from '@/lib/trip/activities';
import { StatusChip } from './StatusChip';

// Én destination i listen: opholdskort, "Planlagt", "Ønsker" og en tilføj-knap.
export function DestinationSection({
  destination,
  stays,
  activities,
}: {
  destination: Destination;
  stays: Stay[];
  activities: Activity[];
}) {
  const { planlagt, oensker } = splitActivities(activities);
  return (
    <section id={`dest-${destination.id}`} className="destination" aria-labelledby={`dest-h-${destination.id}`}>
      <div className="destination-head">
        <h2 id={`dest-h-${destination.id}`}>
          <span className="swatch" style={{ background: destination.color }} />
          {destination.name}
        </h2>
        {destination.area ? <span className="muted small">{destination.area}</span> : null}
      </div>

      {stays.length === 0 ? <p className="tom">Intet hotel endnu.</p> : null}
      {stays.map((s) => (
        <StayKort key={s.id} stay={s} farve={destination.color} />
      ))}

      <AktivitetsListe titel="Planlagt" liste={planlagt} tomTekst="Intet planlagt endnu." medDato />
      <AktivitetsListe titel="Ønsker" liste={oensker} tomTekst="Ingen ønsker endnu." />

      <div>
        <Link href={`/aktivitet/ny?destination=${destination.id}`} className="btn btn-small">
          + Aktivitet i {destination.name}
        </Link>
      </div>
    </section>
  );
}

function StayKort({ stay, farve }: { stay: Stay; farve: string }) {
  return (
    <article className="kort stay-kort" style={{ borderLeftColor: farve }}>
      <div className="linje" style={{ justifyContent: 'space-between' }}>
        <Link href={`/hotel/${stay.id}`} className="titel">
          {stay.name}
        </Link>
        <StatusChip status={stay.status} />
      </div>
      <div className="linje num">
        <span>{formatDateRange(stay.check_in, stay.check_out)}</span>
        <span className="muted">{nightsLabel(nights(stay))}</span>
      </div>
      {stay.room_setup ? <p className="muted small">{stay.room_setup}</p> : null}
    </article>
  );
}

function AktivitetsListe({
  titel,
  liste,
  tomTekst,
  medDato = false,
}: {
  titel: string;
  liste: Activity[];
  tomTekst: string;
  medDato?: boolean;
}) {
  return (
    <div className="akt-gruppe">
      <h3>{titel}</h3>
      {liste.length === 0 ? (
        <p className="tom">{tomTekst}</p>
      ) : (
        <ul className="akt-liste">
          {liste.map((a) => (
            <li key={a.id}>
              <Link href={`/aktivitet/${a.id}`}>
                {medDato ? (
                  <span className="hvornaar num">
                    {formatDate(a.date!, true)}
                    {a.time_of_day ? `, ${a.time_of_day}` : ''}
                  </span>
                ) : null}
                <span className="titel">{a.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
