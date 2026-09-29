// Tidslinjens geometri. Aksen er alle rejsedage (26. dec. – 12. jan., 18 dage) lagt
// side om side; en position er en procent af den samlede bredde. Et ophold går fra
// midt på check-in-dagen til midt på check-ud-dagen, så bredden er præcis
// nætter / antal dage — proportional med nætterne.

import type { TimeOfDay } from '../types';
import { TRIP_END, TRIP_START, daysBetween, nights, tripDays } from './dates';

export type Axis = { start: string; slut: string; antalDage: number };

export function makeAxis(start: string = TRIP_START, slut: string = TRIP_END): Axis {
  return { start, slut, antalDage: tripDays(start, slut).length };
}

// Procent-position for et tidspunkt: dato + brøkdel af dagen (0 = midnat, 0.5 = middag).
export function positionPct(axis: Axis, dato: string, broek = 0.5): number {
  return ((daysBetween(axis.start, dato) + broek) / axis.antalDage) * 100;
}

export type Block = { leftPct: number; widthPct: number; nights: number };

export function blockLayout(axis: Axis, stay: { check_in: string; check_out: string }): Block {
  const n = nights(stay);
  const start = Math.max(0, positionPct(axis, stay.check_in));
  const slut = Math.min(100, positionPct(axis, stay.check_out));
  return { leftPct: start, widthPct: Math.max(0, slut - start), nights: n };
}

// '13:40:00' → 13,67/24
export function timeFraction(tid: string | null): number | null {
  if (!tid) return null;
  const [h, m] = tid.split(':').map(Number);
  return (h + m / 60) / 24;
}

export const TID_PAA_DAGEN_BROEK: Record<TimeOfDay, number> = {
  morgen: 0.3,
  formiddag: 0.42,
  eftermiddag: 0.6,
  aften: 0.8,
};

// Nu-linjen: kun når `nu` ligger inden for rejsen, ellers null.
export function todayPct(axis: Axis, nu: Date): number | null {
  const dato = `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}-${String(nu.getDate()).padStart(2, '0')}`;
  if (dato < axis.start || dato > axis.slut) return null;
  const broek = (nu.getHours() + nu.getMinutes() / 60) / 24;
  return positionPct(axis, dato, broek);
}

// Fordeler etiketter på vandrette baner, så de ikke overlapper: hver etiket
// lægges i den første bane, hvor forrige etiket ligger mindst `minAfstand`
// procent til venstre. Input skal være sorteret efter position.
export function assignLanes(positioner: number[], minAfstand: number): number[] {
  const sidste: number[] = [];
  return positioner.map((p) => {
    let bane = sidste.findIndex((x) => p - x >= minAfstand);
    if (bane === -1) bane = sidste.length;
    sidste[bane] = p;
    return bane;
  });
}
