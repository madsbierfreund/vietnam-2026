import Link from 'next/link';
import type { Activity, Destination, Stay } from '@/lib/types';
import { formatDateRange, kalenderFlise, nights, nightsLabel } from '@/lib/trip/dates';
import { activitiesForDay, splitActivities, stayDays } from '@/lib/trip/activities';
import { StatusChip } from './StatusChip';

// Én destination i listen: opholdskort med dagene som kalenderfliser, "Ønsker" og en
// tilføj-knap. Tilføj-knapperne vises kun for redaktører.
export function DestinationSection({
  destination,
  stays,
  activities,
  alleStays,
  alleAktiviteter,
  kanRedigere,
}: {
  destination: Destination;
  stays: Stay[];
  activities: Activity[];
  alleStays: Stay[];
  alleAktiviteter: Activity[];
  kanRedigere: boolean;
}) {
  const { oensker } = splitActivities(activities);
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
        <div key={s.id} className="stay-med-dage">
          <StayKort stay={s} farve={destination.color} />
          <Dage
            dage={stayDays(s, alleStays)}
            aktiviteter={alleAktiviteter}
            destinationId={destination.id}
            kanRedigere={kanRedigere}
          />
        </div>
      ))}

      <AktivitetsListe titel="Ønsker" liste={oensker} tomTekst="Ingen ønsker endnu." />

      {kanRedigere ? (
        <div>
          <Link href={`/aktivitet/ny?destination=${destination.id}`} className="btn btn-small">
            + Aktivitet i {destination.name}
          </Link>
        </div>
      ) : null}
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

// Opholdets dage som kalenderfliser, hver med dagens aktiviteter (alle aktiviteter
// med den dato) sorteret efter tid på dagen. En tom dag viser kun flisen og knappen.
function Dage({
  dage,
  aktiviteter,
  destinationId,
  kanRedigere,
}: {
  dage: string[];
  aktiviteter: Activity[];
  destinationId: string;
  kanRedigere: boolean;
}) {
  return (
    <ol className="dage">
      {dage.map((dato) => {
        const f = kalenderFlise(dato);
        const dagens = activitiesForDay(aktiviteter, dato);
        return (
          <li key={dato} className="dag">
            <div className="kalender" aria-label={`${f.ugedag} ${f.dag}. ${f.maaned}`}>
              <span className="kal-ugedag">{f.ugedag}</span>
              <span className="kal-dag num">{f.dag}</span>
              <span className="kal-maaned">{f.maaned}</span>
            </div>
            <div className="dag-indhold">
              {dagens.length > 0 ? (
                <ul className="dag-aktiviteter">
                  {dagens.map((a) => (
                    <li key={a.id}>
                      <Link href={`/aktivitet/${a.id}`}>
                        {a.time_of_day ? <span className="muted small">{a.time_of_day} </span> : null}
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              {kanRedigere ? (
                <div>
                  <Link href={`/aktivitet/ny?destination=${destinationId}&dato=${dato}`} className="btn btn-small">
                    + Aktivitet
                  </Link>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function AktivitetsListe({ titel, liste, tomTekst }: { titel: string; liste: Activity[]; tomTekst: string }) {
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
                <span className="titel">{a.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
