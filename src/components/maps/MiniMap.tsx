'use client';

import { AdvancedMarker, Map } from '@vis.gl/react-google-maps';
import { KortBesked, MapsProvider, useKortFejl, useMapId } from './MapsProvider';

// Lille kort på detaljesiderne med én markør i destinationens farve.
export function MiniMap({ lat, lng, farve, titel }: { lat: number | null; lng: number | null; farve: string; titel: string }) {
  return (
    <MapsProvider>
      <Indhold lat={lat} lng={lng} farve={farve} titel={titel} />
    </MapsProvider>
  );
}

function Indhold({ lat, lng, farve, titel }: { lat: number | null; lng: number | null; farve: string; titel: string }) {
  const kortFejl = useKortFejl(true);
  const mapId = useMapId();
  if (kortFejl) return <KortBesked tekst={kortFejl} />;
  if (lat === null || lng === null) return <KortBesked tekst="Mangler placering. Ret og søg stedet frem for at sætte det." />;
  return (
    <Map
      mapId={mapId}
      defaultCenter={{ lat, lng }}
      defaultZoom={14}
      mapTypeControl={false}
      streetViewControl={false}
      clickableIcons={false}
      style={{ width: '100%', height: '100%' }}
    >
      <AdvancedMarker position={{ lat, lng }} title={titel}>
        <span className="pin" style={{ background: farve }} />
      </AdvancedMarker>
    </Map>
  );
}
