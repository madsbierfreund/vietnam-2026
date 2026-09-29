// Roller og adgang. Samme regel som databasens kan_redigere() og RLS
// (supabase/migrations/20260929130000_roller.sql) — databasen er den endelige håndhævelse.
//   redaktør — må oprette, rette og slette alt
//   læser    — må se alt, men intet oprette, rette eller slette
// En bruger uden profil (eller med en ukendt rolle) er læser: fail closed.
// Roller sættes kun i Supabase (Table Editor → profiles), aldrig i appen.

export type Rolle = 'redaktør' | 'læser';

export function rolleFraProfil(profil: { role: string } | null | undefined): Rolle {
  return profil?.role === 'redaktør' ? 'redaktør' : 'læser';
}

export function kanRedigere(rolle: Rolle): boolean {
  return rolle === 'redaktør';
}

// Fejltekst hvis rollen ikke må gemme/slette, ellers null.
export function redigeringsFejl(rolle: Rolle, handling: string): string | null {
  return kanRedigere(rolle) ? null : `Kunne ikke ${handling}: du har kun læseadgang (rolle: ${rolle}).`;
}
