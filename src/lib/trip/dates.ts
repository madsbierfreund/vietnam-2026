// Datoregning for rejsen. Alle datoer er 'YYYY-MM-DD'-strenge og regnes i UTC,
// så resultatet aldrig afhænger af enhedens tidszone.

export const TRIP_START = '2026-12-26';
export const TRIP_END = '2027-01-12';

const DAG_MS = 24 * 60 * 60 * 1000;

function tilMs(dato: string): number {
  const [y, m, d] = dato.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fraMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(dato: string, antal: number): string {
  return fraMs(tilMs(dato) + antal * DAG_MS);
}

// Antal hele dage fra `fra` til `til` (negativ hvis `til` ligger før).
export function daysBetween(fra: string, til: string): number {
  return Math.round((tilMs(til) - tilMs(fra)) / DAG_MS);
}

// Nætter pr. ophold: afledt af check_in/check_out, aldrig gemt.
export function nights(stay: { check_in: string; check_out: string }): number {
  return daysBetween(stay.check_in, stay.check_out);
}

// Alle dage fra `start` til og med `slut` — som standard 26. dec. til 12. jan.
export function tripDays(start: string = TRIP_START, slut: string = TRIP_END): string[] {
  const dage: string[] = [];
  for (let d = start; d <= slut; d = addDays(d, 1)) dage.push(d);
  return dage;
}

// Hvilket ophold gælder natten der begynder på `dato`? Natten til check_out hører
// IKKE med (man er checket ud). Null hvis ingen ophold dækker natten.
export function stayForNight<T extends { check_in: string; check_out: string }>(
  stays: T[],
  dato: string,
): T | null {
  return stays.find((s) => s.check_in <= dato && dato < s.check_out) ?? null;
}

// ── Dansk visning (manuel, så server og browser altid giver samme tekst) ──
const MAANEDER = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'];
const UGEDAGE = ['søn.', 'man.', 'tir.', 'ons.', 'tor.', 'fre.', 'lør.'];

export function formatDate(dato: string, medUgedag = false): string {
  const [, m, d] = dato.split('-').map(Number);
  const tekst = `${d}. ${MAANEDER[m - 1]}`;
  if (!medUgedag) return tekst;
  return `${UGEDAGE[new Date(tilMs(dato)).getUTCDay()]} ${tekst}`;
}

export function formatDateRange(fra: string, til: string): string {
  return `${formatDate(fra)} – ${formatDate(til)}`;
}

// '13:40:00' → '13:40'
export function formatTime(tid: string | null): string {
  return tid ? tid.slice(0, 5) : '';
}

// Ankomst før afgang betyder næste dag, fx 10:50–04:30 (+1).
export function formatTimeSpan(afgang: string | null, ankomst: string | null): string {
  if (!afgang && !ankomst) return '';
  if (afgang && !ankomst) return formatTime(afgang);
  if (!afgang && ankomst) return `ank. ${formatTime(ankomst)}`;
  const plus = ankomst! < afgang! ? ' (+1)' : '';
  return `${formatTime(afgang)}–${formatTime(ankomst)}${plus}`;
}

export function nightsLabel(antal: number): string {
  return antal === 1 ? '1 nat' : `${antal} nætter`;
}

// Kalenderflise: "tor" / "31" / "dec".
const UGEDAG_KORT = ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'];
const MAANED_KORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

export function kalenderFlise(dato: string): { ugedag: string; dag: number; maaned: string } {
  const [, m, d] = dato.split('-').map(Number);
  return { ugedag: UGEDAG_KORT[new Date(tilMs(dato)).getUTCDay()], dag: d, maaned: MAANED_KORT[m - 1] };
}
