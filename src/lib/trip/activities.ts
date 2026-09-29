// Aktivitetslister pr. destination: "Planlagt" (med dato, sorteret efter dato og
// tid på dagen) og "Ønsker" (uden dato).

import { TIDER_PAA_DAGEN, type TimeOfDay } from '../types';
import { addDays } from './dates';

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

// Rejsens første dag: datoen for den første transport (flyet ud). Det er en ren
// rejsedag uden aktiviteter. Null hvis der ingen transport er.
export function foersteRejsedag(transport: { date: string }[]): string | null {
  return transport.map((t) => t.date).sort()[0] ?? null;
}

// Datointervallet en aktivitet må lægges i: destinationens opholdsperiode, men
// tidligst dagen efter rejsens første dag. Null hvis der ingen gyldige datoer er.
export function aktivitetsPeriode(
  destinationId: string,
  stays: { destination_id: string; check_in: string; check_out: string }[],
  foersteDag: string | null,
): { min: string; max: string } | null {
  const periode = destinationPeriod(destinationId, stays);
  if (!periode || !foersteDag) return periode;
  const tidligst = addDays(foersteDag, 1);
  const min = periode.min < tidligst ? tidligst : periode.min;
  return min <= periode.max ? { min, max: periode.max } : null;
}

// Dagene under et hotel: fra check-in til og med dagen før check-ud. Rejsens
// sidste ophold (senest check-ud) får også check-ud-dagen med, da ingen andre
// ophold dækker den dag. Rejsens første dag (flyet ud) får aldrig en dag.
export function stayDays(
  stay: { id: string; check_in: string; check_out: string },
  alleStays: { id: string; check_out: string }[],
  foersteDag: string | null,
): string[] {
  const dage: string[] = [];
  for (let d = stay.check_in; d < stay.check_out; d = addDays(d, 1)) dage.push(d);
  const sidsteUd = alleStays.map((s) => s.check_out).sort().at(-1);
  if (stay.check_out === sidsteUd) dage.push(stay.check_out);
  return dage.filter((d) => d !== foersteDag);
}

// En dags aktiviteter: morgen, formiddag, eftermiddag, aften, derefter uden tid;
// inden for samme tid alfabetisk.
export function activitiesForDay<T extends { date: string | null; time_of_day: TimeOfDay | null; title: string }>(
  aktiviteter: T[],
  dato: string,
): T[] {
  return aktiviteter
    .filter((a) => a.date === dato)
    .sort((a, b) => tidIndeks(a.time_of_day) - tidIndeks(b.time_of_day) || a.title.localeCompare(b.title, 'da'));
}
