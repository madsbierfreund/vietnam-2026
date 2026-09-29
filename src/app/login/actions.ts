'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Logger ind med e-mail og adgangskode. Fejlen fra Supabase vises uændret med.
export async function login(_forrige: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return `Kunne ikke logge ind: ${error.message}`;

  redirect('/');
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`Kunne ikke logge ud: ${error.message}`);
  redirect('/login');
}
