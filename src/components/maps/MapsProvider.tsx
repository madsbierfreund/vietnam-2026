'use client';

import { APIProvider, APILoadingStatus, useApiLoadingStatus } from '@vis.gl/react-google-maps';
import { createContext, useContext, useState } from 'react';

// Google Maps-opsætning. Mangler en miljøvariabel, vises en tydelig besked i
// stedet for kortet/søgningen — resten af siden virker stadig.

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? '';

type Konfig = { apiKey: string; mapId: string; indlaesningsfejl: string | null };
const KonfigContext = createContext<Konfig>({ apiKey: '', mapId: '', indlaesningsfejl: null });

export function MapsProvider({ children }: { children: React.ReactNode }) {
  const [indlaesningsfejl, setIndlaesningsfejl] = useState<string | null>(null);
  const konfig = { apiKey: API_KEY, mapId: MAP_ID, indlaesningsfejl };
  if (!API_KEY) return <KonfigContext.Provider value={konfig}>{children}</KonfigContext.Provider>;
  return (
    <KonfigContext.Provider value={konfig}>
      <APIProvider
        apiKey={API_KEY}
        language="da"
        region="VN"
        onError={(e) => setIndlaesningsfejl(e instanceof Error ? e.message : String(e))}
      >
        {children}
      </APIProvider>
    </KonfigContext.Provider>
  );
}

// Returnerer en dansk fejltekst hvis kortet ikke kan vises, ellers null.
export function useKortFejl(kraeverMapId: boolean): string | null {
  const { apiKey, mapId, indlaesningsfejl } = useContext(KonfigContext);
  const status = useApiLoadingStatus(); // uden APIProvider: NOT_LOADED
  const mangler = [!apiKey && 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', kraeverMapId && !mapId && 'NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID'].filter(
    Boolean,
  ) as string[];
  if (mangler.length > 0) {
    return `Kortet kan ikke vises: miljøvariablen ${mangler.join(' og ')} mangler.`;
  }
  if (indlaesningsfejl) return `Google Maps kunne ikke indlæses: ${indlaesningsfejl}`;
  if (status === APILoadingStatus.AUTH_FAILURE) {
    return 'Google Maps afviste API-nøglen (AUTH_FAILURE). Tjek at nøglen er begrænset til dette domæne, og at Maps JavaScript API og Places API (New) er slået til.';
  }
  if (status === APILoadingStatus.FAILED) return 'Google Maps kunne ikke indlæses (FAILED). Se browserkonsollen for detaljer.';
  return null;
}

export function useMapId(): string {
  return useContext(KonfigContext).mapId;
}

export function KortBesked({ tekst }: { tekst: string }) {
  return (
    <div className="kort-besked" role="status">
      {tekst}
    </div>
  );
}
