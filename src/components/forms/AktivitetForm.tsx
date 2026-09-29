'use client';

import Link from 'next/link';
import { useState } from 'react';
import { gemAktivitet } from '@/app/actions';
import { TIDER_PAA_DAGEN, type Activity, type Destination, type Stay } from '@/lib/types';
import { destinationPeriod } from '@/lib/trip/activities';
import { formatDate } from '@/lib/trip/dates';
import { nearestDestinationId } from '@/lib/trip/geo';
import { MapsProvider } from '../maps/MapsProvider';
import { PlaceField } from './PlaceField';
import { useFormular } from './useFormular';

// Tilføj/ret aktivitet. Når et sted vælges, forvælges destinationen hvis hotel
// ligger nærmest (kan ændres). Datoen er valgfri og begrænset til destinationens ophold.
export function AktivitetForm({
  destinations,
  stays,
  activity,
  forvalgtDestinationId,
}: {
  destinations: Destination[];
  stays: Stay[];
  activity?: Activity;
  forvalgtDestinationId?: string;
}) {
  const { fejl, gemmer, onSubmit } = useFormular(gemAktivitet);
  const [destinationId, setDestinationId] = useState(activity?.destination_id ?? forvalgtDestinationId ?? '');
  const [titel, setTitel] = useState(activity?.title ?? '');
  const [dato, setDato] = useState(activity?.date ?? '');
  const [forvalgtBesked, setForvalgtBesked] = useState<string | null>(null);

  const periode = destinationId ? destinationPeriod(destinationId, stays) : null;
  const datoUdenfor = dato !== '' && periode !== null && (dato < periode.min || dato > periode.max);

  function skiftDestination(id: string) {
    setDestinationId(id);
    const p = destinationPeriod(id, stays);
    if (dato && (!p || dato < p.min || dato > p.max)) setDato('');
  }

  return (
    <MapsProvider>
      <form onSubmit={onSubmit} className="form">
        {activity ? <input type="hidden" name="id" value={activity.id} /> : null}

        <PlaceField
          start={{
            lat: activity?.lat ?? null,
            lng: activity?.lng ?? null,
            google_place_id: activity?.google_place_id ?? null,
            google_maps_url: activity?.google_maps_url ?? null,
          }}
          onPick={(sted) => {
            if (!titel.trim()) setTitel(sted.name);
            const naermeste = nearestDestinationId(sted, stays);
            if (naermeste) {
              skiftDestination(naermeste);
              const navn = destinations.find((d) => d.id === naermeste)?.name ?? '';
              setForvalgtBesked(`Destinationen er sat til ${navn}, hvis hotel ligger nærmest. Du kan ændre den.`);
            } else {
              setForvalgtBesked('Ingen hoteller har en placering endnu, så destinationen kunne ikke forvælges.');
            }
          }}
        />

        <label className="felt">
          <span>Titel</span>
          <input name="title" required value={titel} onChange={(e) => setTitel(e.target.value)} />
        </label>

        <label className="felt">
          <span>Destination</span>
          <select name="destination_id" required value={destinationId} onChange={(e) => skiftDestination(e.target.value)}>
            <option value="" disabled>
              Vælg …
            </option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {forvalgtBesked ? <span className="hjaelp">{forvalgtBesked}</span> : null}
        </label>

        <div className="felt-par">
          <label className="felt">
            <span>Dato (valgfri)</span>
            <input
              type="date"
              name="date"
              value={dato}
              onChange={(e) => setDato(e.target.value)}
              min={periode?.min}
              max={periode?.max}
              disabled={!periode}
            />
            <span className="hjaelp num">
              {periode
                ? `Mellem ${formatDate(periode.min)} og ${formatDate(periode.max)}. Uden dato kommer den under Ønsker.`
                : destinationId
                  ? 'Destinationen har intet hotel endnu, så der kan ikke vælges dato.'
                  : 'Vælg først en destination.'}
            </span>
          </label>
          <label className="felt">
            <span>Tid på dagen</span>
            <select name="time_of_day" defaultValue={activity?.time_of_day ?? ''}>
              <option value="">—</option>
              {TIDER_PAA_DAGEN.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        {datoUdenfor ? <p className="advarsel">Datoen ligger uden for opholdet på destinationen.</p> : null}

        <label className="felt">
          <span>Beskrivelse</span>
          <textarea name="description" rows={4} defaultValue={activity?.description} />
        </label>

        <label className="felt">
          <span>Link</span>
          <input type="url" name="url" defaultValue={activity?.url ?? ''} placeholder="https://" />
        </label>

        {fejl ? <p className="fejl">{fejl}</p> : null}

        <div className="btn-row">
          <button type="submit" className="btn btn-primary" disabled={gemmer}>
            {gemmer ? 'Gemmer …' : 'Gem aktivitet'}
          </button>
          <Link href={activity ? `/aktivitet/${activity.id}` : '/'} className="btn">
            Annullér
          </Link>
        </div>
      </form>
    </MapsProvider>
  );
}
