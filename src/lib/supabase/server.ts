import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Supabase-klient til server-komponenter og server actions. Læser og skriver
// brugerens session via cookies. Kun anon-nøglen; RLS gælder.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Kaldt fra en server-komponent, hvor cookies ikke kan sættes.
            // Proxy'en fornyer sessionen på hver request, så det er ufarligt.
          }
        },
      },
    },
  );
}
