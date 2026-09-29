'use client';

import { AdvancedMarker, InfoWindow, Map, Polyline, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Activity, Destination, Stay, Transport } from '@/lib/types';
import { formatDate, formatDateRange, nights, nightsLabel } from '@/lib/trip/dates';
import { routeLegs, sortStays } from '@/lib/trip/route';
import type { LatLng } from '@/lib/trip/geo';
import { KortBesked, useKortFejl, useMapId } from './MapsProvider';

// Oversigtskortet: opholdene som nummererede markører i rejse-rækkefølge, ruten
// gennem dem og til SGN (stiplet på ben med fly), aktiviteterne som små markører.

const VIETNAM: LatLng = { lat: 15.9, lng: 106.9 };

type Aaben = { type: 'stay' | 'activity'; id: string } | null;

export type Fokus = { destinationId: string; n: number } | null;

export function TripMap(props: {
  destinations: Destination[];
  stays: Stay[];
  transport: Transport[];
  activities: Activity[];
  fokus: Fokus;
}) {
  const kortFejl = useKortFejl(true);
  if (kortFejl) return <KortBesked tekst={kortFejl} />;
  return <Kort {...props} />;
}

function harPos<T extends { lat: number | null; lng: number | null }>(x: T): x is T & LatLng {
  return x.lat !== null && x.lng !== null;
}

function Kort({
  destinations,
  stays,
  transport,
  activities,
  fokus,
}: {
  destinations: Destination[];
  stays: Stay[];
  transport: Transport[];
  activities: Activity[];
  fokus: Fokus;
}) {
  const mapId = useMapId();
  const [aaben, setAaben] = useState<Aaben>(null);
  const sgn = useSgn();

  const farve = useMemo(() => new globalThis.Map(destinations.map((d) => [d.id, d.color])), [destinations]);
  const ordnet = useMemo(() => sortStays(stays), [stays]);
  const legs = useMemo(() => routeLegs(ordnet, transport), [ordnet, transport]);

  const aabenStay = aaben?.type === 'stay' ? stays.find((s) => s.id === aaben.id) : undefined;
  const aabenAkt = aaben?.type === 'activity' ? activities.find((a) => a.id === aaben.id) : undefined;

  return (
    <div className="kort-ramme">
    <Map
      mapId={mapId}
      defaultCenter={VIETNAM}
      defaultZoom={5}
      mapTypeControl={false}
      streetViewControl={false}
      clickableIcons={false}
      style={{ width: '100%', height: '100%' }}
    >
      <Kamera stays={stays} activities={activities} sgn={sgn.pos} fokus={fokus} />

      {legs.map((leg) => {
        const fra = ordnet.find((s) => s.id === leg.fraStayId);
        const til = leg.tilStayId ? ordnet.find((s) => s.id === leg.tilStayId) : null;
        const tilPos = til ? (harPos(til) ? til : null) : sgn.pos;
        if (!fra || !harPos(fra) || !tilPos) return null;
        return <Ben key={leg.fraStayId} fra={fra} til={tilPos} stiplet={leg.medFly} />;
      })}

      {activities.filter(harPos).map((a) => (
        <AdvancedMarker
          key={a.id}
          position={{ lat: a.lat, lng: a.lng }}
          title={a.title}
          onClick={() => setAaben({ type: 'activity', id: a.id })}
          zIndex={1}
        >
          <span className="pin-lille" style={{ background: farve.get(a.destination_id) }} />
        </AdvancedMarker>
      ))}

      {ordnet.map((s, i) =>
        harPos(s) ? (
          <AdvancedMarker
            key={s.id}
            position={{ lat: s.lat, lng: s.lng }}
            title={s.name}
            onClick={() => setAaben({ type: 'stay', id: s.id })}
            zIndex={10 + i}
          >
            <span className="pin" style={{ background: farve.get(s.destination_id) }}>
              {i + 1}
            </span>
          </AdvancedMarker>
        ) : null,
      )}

      {sgn.pos ? (
        <AdvancedMarker position={sgn.pos} title="Tan Son Nhat-lufthavnen (SGN)" zIndex={5}>
          <span className="pin-sgn">SGN</span>
        </AdvancedMarker>
      ) : null}

      {aabenStay && harPos(aabenStay) ? (
        <InfoWindow
          position={{ lat: aabenStay.lat, lng: aabenStay.lng }}
          pixelOffset={[0, -34]}
          onCloseClick={() => setAaben(null)}
          headerDisabled
        >
          <div className="info">
            <strong>{aabenStay.name}</strong>
            <span className="num">
              {formatDateRange(aabenStay.check_in, aabenStay.check_out)} · {nightsLabel(nights(aabenStay))}
            </span>
            <br />
            <Link href={`/hotel/${aabenStay.id}`}>Se hotellet</Link>
          </div>
        </InfoWindow>
      ) : null}

      {aabenAkt && harPos(aabenAkt) ? (
        <InfoWindow
          position={{ lat: aabenAkt.lat, lng: aabenAkt.lng }}
          pixelOffset={[0, -14]}
          onCloseClick={() => setAaben(null)}
          headerDisabled
        >
          <div className="info">
            <strong>{aabenAkt.title}</strong>
            <span className="num">
              {aabenAkt.date
                ? `${formatDate(aabenAkt.date, true)}${aabenAkt.time_of_day ? `, ${aabenAkt.time_of_day}` : ''}`
                : 'Ikke lagt på en dag'}
            </span>
            <br />
            <Link href={`/aktivitet/${aabenAkt.id}`}>Se aktiviteten</Link>
          </div>
        </InfoWindow>
      ) : null}

    </Map>
      {sgn.fejl ? <div className="kort-overlay-fejl fejl">{sgn.fejl}</div> : null}
    </div>
  );
}

// Et ben af ruten. Stiplet = fly (Polyline med gennemsigtig streg + gentaget streg-ikon).
function Ben({ fra, til, stiplet }: { fra: LatLng; til: LatLng; stiplet: boolean }) {
  const path = [
    { lat: fra.lat, lng: fra.lng },
    { lat: til.lat, lng: til.lng },
  ];
  if (!stiplet) {
    return <Polyline path={path} strokeColor="#1a1a18" strokeOpacity={0.7} strokeWeight={2.5} geodesic />;
  }
  return (
    <Polyline
      path={path}
      strokeOpacity={0}
      geodesic
      icons={[
        {
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.7, strokeColor: '#1a1a18', strokeWeight: 2.5, scale: 3 },
          offset: '0',
          repeat: '14px',
        },
      ]}
    />
  );
}

// Kameraet: viser hele rejsen første gang, og zoomer til en destination ved klik på tidslinjen.
function Kamera({
  stays,
  activities,
  sgn,
  fokus,
}: {
  stays: Stay[];
  activities: Activity[];
  sgn: LatLng | null;
  fokus: Fokus;
}) {
  const map = useMap();
  const tilpasset = useRef(false);

  const alle = useMemo(() => {
    const p: LatLng[] = [...stays.filter(harPos), ...activities.filter(harPos)].map((x) => ({ lat: x.lat, lng: x.lng }));
    if (sgn) p.push(sgn);
    return p;
  }, [stays, activities, sgn]);

  useEffect(() => {
    if (!map || tilpasset.current || fokus || alle.length === 0) return;
    visPunkter(map, alle, 6);
    // Lås først når SGN er med, så den sidste tilpasning tager lufthavnen med.
    if (sgn) tilpasset.current = true;
  }, [map, alle, fokus, sgn]);

  useEffect(() => {
    if (!map || !fokus) return;
    const punkter = [
      ...stays.filter((s) => s.destination_id === fokus.destinationId).filter(harPos),
      ...activities.filter((a) => a.destination_id === fokus.destinationId).filter(harPos),
    ].map((x) => ({ lat: x.lat, lng: x.lng }));
    if (punkter.length > 0) visPunkter(map, punkter, 13);
    // Kun når brugeren klikker (fokus.n skifter) — ikke når data opdateres.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fokus?.n]);

  return null;
}

function visPunkter(map: google.maps.Map, punkter: LatLng[], maxZoom: number) {
  if (punkter.length === 1) {
    map.setCenter(punkter[0]);
    map.setZoom(maxZoom);
    return;
  }
  const b = new google.maps.LatLngBounds();
  punkter.forEach((p) => b.extend(p));
  map.fitBounds(b, 48);
  google.maps.event.addListenerOnce(map, 'idle', () => {
    if ((map.getZoom() ?? 0) > maxZoom) map.setZoom(maxZoom);
  });
}

// SGN placeres fra Places (tekstsøgning), ikke fra hårdkodede koordinater.
let sgnCache: Promise<LatLng> | null = null;

function useSgn(): { pos: LatLng | null; fejl: string | null } {
  const places = useMapsLibrary('places');
  const [pos, setPos] = useState<LatLng | null>(null);
  const [fejl, setFejl] = useState<string | null>(null);

  useEffect(() => {
    if (!places) return;
    sgnCache ??= places.Place.searchByText({
      textQuery: 'Tan Son Nhat International Airport (SGN), Ho Chi Minh City',
      fields: ['location'],
      maxResultCount: 1,
    }).then(({ places: fundne }) => {
      const loc = fundne[0]?.location;
      if (!loc) throw new Error('ingen resultater');
      return { lat: loc.lat(), lng: loc.lng() };
    });
    let aktiv = true;
    sgnCache.then(
      (p) => aktiv && setPos(p),
      (e) => {
        sgnCache = null;
        if (aktiv) setFejl(`Kunne ikke placere SGN-lufthavnen via Places: ${e instanceof Error ? e.message : String(e)}`);
      },
    );
    return () => {
      aktiv = false;
    };
  }, [places]);

  return { pos, fejl };
}
