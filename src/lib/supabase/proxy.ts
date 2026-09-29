import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Fornyer sessionen på hver request og beskytter alt bag login.
// Uden login ser man kun /login.
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    const mangler = [!url && 'NEXT_PUBLIC_SUPABASE_URL', !anonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
      .filter(Boolean)
      .join(' og ');
    return new NextResponse(`Appen er ikke sat op: miljøvariablen ${mangler} mangler.`, {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Kald getUser() straks, så sessionen fornyes og cookies skrives korrekt.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const erLogin = pathname.startsWith('/login');

  if (!user && !erLogin) {
    const til = request.nextUrl.clone();
    til.pathname = '/login';
    til.search = '';
    return NextResponse.redirect(til);
  }

  if (user && erLogin) {
    const til = request.nextUrl.clone();
    til.pathname = '/';
    til.search = '';
    return NextResponse.redirect(til);
  }

  return response;
}
