// Afstand og nærmeste destination. Bruges til at forvælge destinationen, når man
// tilføjer en aktivitet: den destination hvis ophold ligger tættest på stedet.

export type LatLng = { lat: number; lng: number };

// Storcirkel-afstand i km (haversine).
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Destinationen for det nærmeste ophold MED placering. Null hvis intet ophold har en.
export function nearestDestinationId(
  sted: LatLng,
  stays: { destination_id: string; lat: number | null; lng: number | null }[],
): string | null {
  let bedste: { id: string; km: number } | null = null;
  for (const s of stays) {
    if (s.lat === null || s.lng === null) continue;
    const km = distanceKm(sted, { lat: s.lat, lng: s.lng });
    if (!bedste || km < bedste.km) bedste = { id: s.destination_id, km };
  }
  return bedste?.id ?? null;
}
