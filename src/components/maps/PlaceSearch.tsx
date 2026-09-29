'use client';

import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useRef, useState } from 'react';
import type { PickedPlace } from '@/lib/types';
import { useKortFejl } from './MapsProvider';

type Forslag = { id: string; primaer: string; sekundaer: string; forudsigelse: google.maps.places.PlacePrediction };

// Stedsøgning med Places Autocomplete (New). Brugeren søger og vælger et resultat;
// vi gemmer lat, lng, google_place_id og google_maps_url. Ingen manuelle koordinater.
export function PlaceSearch({
  onPick,
  autoFocus = false,
  placeholder = 'Søg efter et sted, fx Hoa Lo Prison',
}: {
  onPick: (sted: PickedPlace) => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const kortFejl = useKortFejl(false);
  if (kortFejl) {
    return <p className="advarsel">{kortFejl.replace('Kortet kan ikke vises', 'Stedsøgning er ikke tilgængelig')}</p>;
  }
  return <Soegning onPick={onPick} autoFocus={autoFocus} placeholder={placeholder} />;
}

function Soegning({
  onPick,
  autoFocus,
  placeholder,
}: {
  onPick: (sted: PickedPlace) => void;
  autoFocus: boolean;
  placeholder: string;
}) {
  const places = useMapsLibrary('places');
  const [soegetekst, setSoegetekst] = useState('');
  const [forslag, setForslag] = useState<Forslag[]>([]);
  const [fejl, setFejl] = useState<string | null>(null);
  const [henter, setHenter] = useState(false);
  const token = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    if (!places) return;
    const q = soegetekst.trim();
    if (q.length < 2) return;
    let annulleret = false;
    const t = setTimeout(async () => {
      try {
        token.current ??= new places.AutocompleteSessionToken();
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: q,
          sessionToken: token.current,
          language: 'da',
          includedRegionCodes: ['vn'],
        });
        if (annulleret) return;
        setFejl(null);
        setForslag(
          suggestions
            .map((s) => s.placePrediction)
            .filter((p): p is google.maps.places.PlacePrediction => p !== null)
            .map((p) => ({
              id: p.placeId,
              primaer: p.mainText?.text ?? p.text.text,
              sekundaer: p.secondaryText?.text ?? '',
              forudsigelse: p,
            })),
        );
      } catch (e) {
        if (!annulleret) setFejl(`Søgningen fejlede: ${e instanceof Error ? e.message : String(e)}`);
      }
    }, 250);
    return () => {
      annulleret = true;
      clearTimeout(t);
    };
  }, [places, soegetekst]);

  // For kort en søgetekst viser ingen forslag (gamle resultater skjules).
  const synlige = soegetekst.trim().length >= 2 ? forslag : [];

  async function vaelg(f: Forslag) {
    setHenter(true);
    setFejl(null);
    try {
      const sted = f.forudsigelse.toPlace();
      await sted.fetchFields({ fields: ['displayName', 'location', 'googleMapsURI', 'id'] });
      token.current = null; // sessionen slutter med fetchFields
      if (!sted.location) throw new Error('stedet har ingen koordinater');
      onPick({
        name: sted.displayName ?? f.primaer,
        lat: sted.location.lat(),
        lng: sted.location.lng(),
        google_place_id: sted.id,
        google_maps_url: sted.googleMapsURI ?? null,
      });
      setSoegetekst('');
      setForslag([]);
    } catch (e) {
      setFejl(`Kunne ikke hente stedet: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setHenter(false);
    }
  }

  return (
    <div className="soeg">
      <input
        type="search"
        value={soegetekst}
        onChange={(e) => setSoegetekst(e.target.value)}
        placeholder={places ? placeholder : 'Indlæser søgning …'}
        disabled={!places || henter}
        autoFocus={autoFocus}
        aria-label="Søg efter sted"
        className="soeg-input"
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault(); // indsend ikke formularen
        }}
      />
      {fejl ? <p className="fejl">{fejl}</p> : null}
      {synlige.length > 0 ? (
        <ul className="forslag">
          {synlige.map((f) => (
            <li key={f.id}>
              <button type="button" onClick={() => vaelg(f)} disabled={henter}>
                {f.primaer}
                {f.sekundaer ? <span className="sekundaer">{f.sekundaer}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
