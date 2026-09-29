'use client';

import Link from 'next/link';
import { gemHotel } from '@/app/actions';
import type { Destination, Stay } from '@/lib/types';
import { TRIP_END, TRIP_START } from '@/lib/trip/dates';
import { MapsProvider } from '../maps/MapsProvider';
import { PlaceField } from './PlaceField';
import { StatusSelect } from './StatusSelect';
import { useFormular } from './useFormular';

export function HotelForm({ destinations, stay }: { destinations: Destination[]; stay?: Stay }) {
  const { fejl, gemmer, onSubmit } = useFormular(gemHotel);

  return (
    <MapsProvider>
      <form onSubmit={onSubmit} className="form">
        {stay ? <input type="hidden" name="id" value={stay.id} /> : null}

        <label className="felt">
          <span>Navn</span>
          <input name="name" required defaultValue={stay?.name} />
        </label>

        <label className="felt">
          <span>Destination</span>
          <select name="destination_id" required defaultValue={stay?.destination_id ?? ''}>
            <option value="" disabled>
              Vælg …
            </option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <div className="felt-par">
          <label className="felt">
            <span>Check-in</span>
            <input type="date" name="check_in" required min={TRIP_START} max={TRIP_END} defaultValue={stay?.check_in} />
          </label>
          <label className="felt">
            <span>Check-ud</span>
            <input type="date" name="check_out" required min={TRIP_START} max={TRIP_END} defaultValue={stay?.check_out} />
          </label>
        </div>

        <PlaceField
          start={{
            lat: stay?.lat ?? null,
            lng: stay?.lng ?? null,
            google_place_id: stay?.google_place_id ?? null,
            google_maps_url: stay?.google_maps_url ?? null,
          }}
        />

        <label className="felt">
          <span>Værelser</span>
          <textarea name="room_setup" rows={2} defaultValue={stay?.room_setup} />
        </label>

        <label className="felt">
          <span>Beskrivelse</span>
          <textarea name="description" rows={5} defaultValue={stay?.description} />
        </label>

        <label className="felt">
          <span>Hjemmeside</span>
          <input type="url" name="website_url" defaultValue={stay?.website_url ?? ''} placeholder="https://" />
        </label>

        <div className="felt-par">
          <label className="felt">
            <span>Ekstra link</span>
            <input type="url" name="extra_url" defaultValue={stay?.extra_url ?? ''} placeholder="https://" />
          </label>
          <label className="felt">
            <span>Tekst til ekstra link</span>
            <input name="extra_url_label" defaultValue={stay?.extra_url_label ?? ''} placeholder="fx Nyhavn Rejser" />
          </label>
        </div>

        <div className="felt-par">
          <label className="felt">
            <span>Pris (kr.)</span>
            <input name="price_dkk" inputMode="decimal" defaultValue={stay?.price_dkk ?? ''} />
            <span className="hjaelp">Lad feltet stå tomt, hvis prisen er ukendt.</span>
          </label>
          <StatusSelect vaerdi={stay?.status ?? 'idé'} />
        </div>

        <label className="felt">
          <span>Prisnote</span>
          <textarea name="price_note" rows={2} defaultValue={stay?.price_note} />
        </label>

        <label className="felt">
          <span>Afbestilling</span>
          <textarea name="cancellation_note" rows={2} defaultValue={stay?.cancellation_note} />
        </label>

        {fejl ? <p className="fejl">{fejl}</p> : null}

        <div className="btn-row">
          <button type="submit" className="btn btn-primary" disabled={gemmer}>
            {gemmer ? 'Gemmer …' : 'Gem hotel'}
          </button>
          <Link href={stay ? `/hotel/${stay.id}` : '/'} className="btn">
            Annullér
          </Link>
        </div>
      </form>
    </MapsProvider>
  );
}
