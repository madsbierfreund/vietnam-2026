'use client';

import { useCallback, useState } from 'react';
import type { Trip } from '@/lib/types';
import { MapsProvider } from './maps/MapsProvider';
import { TripMap, type Fokus } from './maps/TripMap';
import { Timeline } from './Timeline';
import { DestinationSection } from './DestinationSection';
import { foersteRejsedag } from '@/lib/trip/activities';
import { ManglerPlacering, type UdenPlacering } from './ManglerPlacering';

// Hele rejsen på én side: tidslinje, kort (sticky på desktop) og destinationslisten.
export function Oversigt({ trip, kanRedigere }: { trip: Trip; kanRedigere: boolean }) {
  const { destinations, stays, transport, activities } = trip;
  const [fokus, setFokus] = useState<Fokus>(null);

  const vaelg = useCallback((destinationId: string) => {
    setFokus((f) => ({ destinationId, n: (f?.n ?? 0) + 1 }));
    document.getElementById(`dest-${destinationId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const destNavn = new Map(destinations.map((d) => [d.id, d.name]));
  const udenPlacering: UdenPlacering[] = [
    ...stays
      .filter((s) => s.lat === null)
      .map((s) => ({ tabel: 'stays' as const, id: s.id, navn: s.name, type: 'hotel' })),
    ...activities
      .filter((a) => a.lat === null)
      .map((a) => ({
        tabel: 'activities' as const,
        id: a.id,
        navn: a.title,
        type: `aktivitet, ${destNavn.get(a.destination_id) ?? ''}`,
      })),
  ];

  return (
    <MapsProvider>
      <Timeline
        destinations={destinations}
        stays={stays}
        transport={transport}
        activities={activities}
        aktivDestinationId={fokus?.destinationId ?? null}
        onVaelg={vaelg}
        kanRedigere={kanRedigere}
      />
      <div className="frame oversigt">
        <div className="kort-kolonne">
          <div className="kortflade">
            <TripMap
              destinations={destinations}
              stays={stays}
              transport={transport}
              activities={activities}
              fokus={fokus}
            />
          </div>
          <ManglerPlacering poster={udenPlacering} kanRedigere={kanRedigere} />
        </div>

        <div className="liste">
          {destinations.map((d) => (
            <DestinationSection
              key={d.id}
              destination={d}
              stays={stays.filter((s) => s.destination_id === d.id)}
              activities={activities.filter((a) => a.destination_id === d.id)}
              alleStays={stays}
              alleAktiviteter={activities}
              foersteDag={foersteRejsedag(transport)}
              kanRedigere={kanRedigere}
            />
          ))}
        </div>
      </div>
    </MapsProvider>
  );
}
