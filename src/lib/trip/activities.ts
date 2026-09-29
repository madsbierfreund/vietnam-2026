// Aktivitetslister pr. destination: "Planlagt" (med dato, sorteret efter dato og
// tid på dagen) og "Ønsker" (uden dato).

import { TIDER_PAA_DAGEN, type TimeOfDay } from '../types';

function tidIndeks(t: TimeOfDay | null): number {
  return t === null ? TIDER_PAA_DAGEN.length : TIDER_PAA_DAGEN.indexOf(t);
}

export function splitActivities<T extends { date: string | null; time_of_day: TimeOfDay | null; title: string }>(
  aktiviteter: T[],
): { planlagt: T[]; oensker: T[] } {
  const planlagt = aktiviteter
    .filter((a) => a.date !== null)
    .sort(
      (a, b) =>
        a.date!.localeCompare(b.date!) ||
        tidIndeks(a.time_of_day) - tidIndeks(b.time_of_day) ||
        a.title.localeCompare(b.title, 'da'),
    );
  const oensker = aktiviteter
    .filter((a) => a.date === null)
    .sort((a, b) => a.title.localeCompare(b.title, 'da'));
  return { planlagt, oensker };
}

// Datointervallet en aktivitet må lægges i: destinationens opholdsperiode
// (første check-in til sidste check-ud, begge inklusive). Null hvis intet ophold.
export function destinationPeriod(
  destinationId: string,
  stays: { destination_id: string; check_in: string; check_out: string }[],
): { min: string; max: string } | null {
  const egne = stays.filter((s) => s.destination_id === destinationId);
  if (egne.length === 0) return null;
  return {
    min: egne.map((s) => s.check_in).sort()[0],
    max: egne.map((s) => s.check_out).sort().at(-1)!,
  };
}
