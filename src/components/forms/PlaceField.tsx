'use client';

import { useState } from 'react';
import type { PickedPlace } from '@/lib/types';
import { PlaceSearch } from '../maps/PlaceSearch';

export type Placering = {
  lat: number | null;
  lng: number | null;
  google_place_id: string | null;
  google_maps_url: string | null;
};

// Placeringsfelt: Places-søgning + skjulte felter til formularen. Ingen manuelle koordinater.
export function PlaceField({
  start,
  onPick,
}: {
  start: Placering;
  onPick?: (sted: PickedPlace) => void;
}) {
  const [sted, setSted] = useState<Placering & { name?: string }>(start);
  const [soeger, setSoeger] = useState(start.lat === null);
  const harSted = sted.lat !== null && sted.lng !== null;

  return (
    <div className="felt">
      <span>Placering</span>
      <input type="hidden" name="lat" value={sted.lat ?? ''} />
      <input type="hidden" name="lng" value={sted.lng ?? ''} />
      <input type="hidden" name="google_place_id" value={sted.google_place_id ?? ''} />
      <input type="hidden" name="google_maps_url" value={sted.google_maps_url ?? ''} />

      {harSted ? (
        <div className="valgt-sted">
          <span>
            {sted.name ?? 'Placering sat'}
            {sted.google_maps_url ? (
              <>
                {' · '}
                <a href={sted.google_maps_url} target="_blank" rel="noreferrer">
                  Åbn i Google Maps
                </a>
              </>
            ) : null}
          </span>
          <span className="btn-row">
            <button type="button" className="btn btn-small" onClick={() => setSoeger((v) => !v)}>
              {soeger ? 'Luk' : 'Skift'}
            </button>
            <button
              type="button"
              className="btn btn-small"
              onClick={() => setSted({ lat: null, lng: null, google_place_id: null, google_maps_url: null })}
            >
              Fjern
            </button>
          </span>
        </div>
      ) : (
        <span className="hjaelp">Ingen placering endnu.</span>
      )}

      {soeger || !harSted ? (
        <PlaceSearch
          onPick={(p) => {
            setSted(p);
            setSoeger(false);
            onPick?.(p);
          }}
        />
      ) : null}
    </div>
  );
}
