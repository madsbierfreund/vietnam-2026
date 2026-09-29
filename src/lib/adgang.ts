import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { kanRedigere, rolleFraProfil, type Rolle } from '@/lib/rolle';

export type Adgang = { rolle: Rolle; kanRedigere: boolean; fejl: string | null };

// Den indloggede brugers rolle, læst fra egen række i profiles (RLS tillader kun den).
// Mangler rækken, eller fejler opslaget, er brugeren læser (fail closed), og
// fejlen returneres med årsagen, så siden kan vise den.
// cache(): hentes kun én gang pr. request, selv om topbar og side begge spørger.
export const hentAdgang = cache(async (): Promise<Adgang> => {
  const supabase = await createClient();
  const {
    data: { user },
    error: brugerFejl,
  } = await supabase.auth.getUser();
  if (brugerFejl || !user) {
    return {
      rolle: 'læser',
      kanRedigere: false,
      fejl: `Kunne ikke læse den indloggede bruger: ${brugerFejl?.message ?? 'ingen bruger'}`,
    };
  }
  const { data, error } = await supabase.from('profiles').select('role').eq('user_id', user.id).maybeSingle();
  if (error) {
    return {
      rolle: 'læser',
      kanRedigere: false,
      fejl: `Kunne ikke læse din rolle, så du har kun læseadgang: ${error.message}`,
    };
  }
  const rolle = rolleFraProfil(data);
  return { rolle, kanRedigere: kanRedigere(rolle), fejl: null };
});

// Til ny/ret-sider: læsere sendes til oversigten.
export async function kraevRedaktoer(): Promise<void> {
  const { kanRedigere } = await hentAdgang();
  if (!kanRedigere) redirect('/');
}
