import { createClient } from '@/lib/supabase/server';
import type { Activity, Destination, Stay, Transport, Trip } from '@/lib/types';

// Hentning til server-komponenter. Fejl returneres som tekst MED den
// underliggende årsag (fx "relation does not exist" hvis migrationen mangler),
// så siden kan vise den i stedet for en generisk fejlside.

export type Hentet<T> = { data: T; fejl: null } | { data: null; fejl: string };

function fejl(hvad: string, e: { message: string } | null): string {
  return `Kunne ikke hente ${hvad}: ${e?.message ?? 'ukendt fejl'}`;
}

export async function hentTrip(): Promise<Hentet<Trip>> {
  const supabase = await createClient();
  const [d, s, t, a] = await Promise.all([
    supabase.from('destinations').select('*').order('sort_order'),
    supabase.from('stays').select('*').order('check_in'),
    supabase.from('transport').select('*').order('date').order('departs_at', { nullsFirst: false }),
    supabase.from('activities').select('*').order('date', { nullsFirst: false }),
  ]);
  if (d.error) return { data: null, fejl: fejl('destinationer', d.error) };
  if (s.error) return { data: null, fejl: fejl('hoteller', s.error) };
  if (t.error) return { data: null, fejl: fejl('transport', t.error) };
  if (a.error) return { data: null, fejl: fejl('aktiviteter', a.error) };
  return {
    data: {
      destinations: d.data as Destination[],
      stays: s.data as Stay[],
      transport: t.data as Transport[],
      activities: a.data as Activity[],
    },
    fejl: null,
  };
}

export async function hentRaekke<T>(
  tabel: 'stays' | 'activities' | 'transport',
  id: string,
): Promise<Hentet<T | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from(tabel).select('*').eq('id', id).maybeSingle();
  if (error) return { data: null, fejl: fejl(tabel, error) };
  return { data: (data as T) ?? null, fejl: null };
}
