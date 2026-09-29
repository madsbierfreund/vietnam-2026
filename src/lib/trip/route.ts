// Ruten på kortet: gennem opholdene i rækkefølge og til sidst til lufthavnen (SGN).
// Et ben går fra ét ophold til det næste på skiftedagen (check-ud-dagen). Benet
// tegnes stiplet, hvis transporten den dag omfatter et fly. Det sidste ben (til
// lufthavnen) medregner ikke dagens sidste fly — flyet hjem, som starter I
// lufthavnen, hvor benet slutter.

import type { Stay, Transport } from '../types';

export type Leg = { fraStayId: string; tilStayId: string | null; dato: string; medFly: boolean };

export function sortStays<T extends { check_in: string }>(stays: T[]): T[] {
  return [...stays].sort((a, b) => a.check_in.localeCompare(b.check_in));
}

export function sortTransport<T extends { date: string; departs_at: string | null }>(t: T[]): T[] {
  return [...t].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.departs_at ?? '99').localeCompare(b.departs_at ?? '99'),
  );
}

export function routeLegs(
  stays: Pick<Stay, 'id' | 'check_in' | 'check_out'>[],
  transport: Pick<Transport, 'id' | 'date' | 'departs_at' | 'kind'>[],
): Leg[] {
  const ordnet = sortStays(stays);
  return ordnet.map((stay, i) => {
    const naeste = ordnet[i + 1] ?? null;
    const dato = stay.check_out;
    let dagens = transport.filter((t) => t.date === dato);
    if (naeste === null) {
      const flyHjem = sortTransport(dagens.filter((t) => t.kind === 'fly')).at(-1);
      dagens = dagens.filter((t) => t !== flyHjem);
    }
    return {
      fraStayId: stay.id,
      tilStayId: naeste?.id ?? null,
      dato,
      medFly: dagens.some((t) => t.kind === 'fly'),
    };
  });
}
