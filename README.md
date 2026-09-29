# Vietnam 2026

Privat webapp til familiens rejse til Vietnam, 26. december 2026 – 12. januar 2027.
Ét fælles sted med tidslinje, kort, hoteller, transport og aktiviteter. Kun to
brugere (Mads og Marie); alt er delt, og alle kan læse, tilføje, rette og slette alt.

## Stack

- Next.js (App Router) + TypeScript (strict), React 19
- Supabase: Postgres, Auth (e-mail + adgangskode), RLS på alle tabeller
- Google Maps: `@vis.gl/react-google-maps`, Maps JavaScript API, Advanced Markers, Places API (New)
- Vitest til enhedstests af den rene rejselogik
- Deploy: Vercel (importér GitHub-repoet)

## Struktur

- `supabase/migrations/20260929120000_init.sql` — hele skemaet: `destinations`, `stays`, `transport`, `activities` + RLS
- `scripts/seed.ts` — idempotent seed af den nuværende plan (`npm run seed`)
- `src/proxy.ts`, `src/lib/supabase/*` — session og login-beskyttelse (alt undtagen `/login` kræver login)
- `src/lib/trip/*` — ren logik uden UI: datoer og nætter, tidslinjens geometri, prissum, nærmeste destination, ruten, aktivitetslister (testet i `trip.test.ts`)
- `src/lib/data.ts` — hentning i server-komponenter; fejl vises med Supabase' egen årsag
- `src/app/actions.ts` — alle skrivninger (server actions)
- `src/components/` — oversigt, tidslinje, destinationsliste, formularer, kort (`maps/`)
- `src/app/` — sider: `/`, `/login`, `/hotel/[id]`, `/hotel/ny`, `/hotel/[id]/rediger`, `/aktivitet/[id]`, `/aktivitet/ny`, `/aktivitet/[id]/rediger`, `/transport/ny`, `/transport/[id]`
- `docs/beslutningslog.md` — hvad vi har besluttet og hvorfor

## Opsætning

### 1. Supabase-projekt

1. Opret et nyt projekt på [supabase.com](https://supabase.com).
2. Under **Authentication → Sign In / Providers**: behold **Email** slået til, og slå **Allow new users to sign up** FRA (ingen offentlig tilmelding).
3. Under **Project Settings → API** finder du `Project URL`, `anon`-nøglen og `service_role`-nøglen.

### 2. Kør migrationen (én gang)

Migrationen er IKKE kørt. Kør `supabase/migrations/20260929120000_init.sql` i Supabase:

- **SQL Editor**: åbn filen, kopiér hele indholdet ind, og tryk **Run**. Eller
- **Supabase CLI**: `supabase link --project-ref <ref>` og derefter `supabase db push`.

### 3. Opret de to brugere

**Authentication → Users → Add user → Create new user**: indtast e-mail og adgangskode, og sæt flueben i **Auto Confirm User**. Gør det for Mads og for Marie. Der er ingen admin-side i appen.

### 4. Google Cloud

1. Opret (eller vælg) et projekt i [Google Cloud Console](https://console.cloud.google.com), og tilknyt en faktureringskonto.
2. **APIs & Services → Library**: slå **Maps JavaScript API** og **Places API (New)** til.
3. **Google Maps Platform → Map management → Create Map ID**: type **JavaScript**, **Vector**. Kopiér Map ID'et (kræves til Advanced Markers).
4. **APIs & Services → Credentials → Create credentials → API key**. Under nøglens restriktioner:
   - *Application restrictions*: **Websites**, tilføj `https://<dit-vercel-domæne>/*` og `http://localhost:3000/*`.
   - *API restrictions*: begræns til **Maps JavaScript API** og **Places API (New)**.

### 5. Miljøvariabler

Kopiér `.env.example` til `.env.local`, og udfyld:

| Variabel | Hvor | Bruges af |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | appen + seed |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (`anon`) | appen |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Cloud → Credentials | appen (kort + stedsøgning) |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Google Maps Platform → Map management | appen (kort) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (`service_role`) | **kun** seed-scriptet |

`SUPABASE_SERVICE_ROLE_KEY` omgår RLS. Den har bevidst intet `NEXT_PUBLIC_`-præfiks, bruges kun i `scripts/seed.ts` og skal **ikke** lægges i Vercel.

Mangler en Google-variabel, viser appen en besked med variablens navn i stedet for kortet; resten virker.

### 6. Seed (efter migrationen)

```bash
npm install
npm run seed
```

Scriptet læser `.env.local` og indsætter destinationer, hoteller (uden koordinater), transport og nytårsmiddagen. Det er idempotent: en post, der allerede findes (samme navn, eller samme dato/type/fra/til for transport), springes over og røres ikke. Rettelser I har lavet i appen overskrives derfor aldrig.

### 7. Kør lokalt

```bash
npm run dev      # http://localhost:3000
npm test         # enhedstests
npm run lint
npm run typecheck
npm run build
```

### 8. Deploy på Vercel

1. **Add New → Project** og importér `madsbierfreund/vietnam-2026`. Framework: Next.js (registreres automatisk).
2. Under **Environment Variables** tilføjer du de fire `NEXT_PUBLIC_*`-variabler (ikke service role-nøglen).
3. **Deploy**. Tilføj bagefter Vercel-domænet til API-nøglens *Website restrictions* i Google Cloud (trin 4).
4. I Supabase under **Authentication → URL Configuration**: sæt **Site URL** til Vercel-domænet.

## Placeringer

Placeringer sættes kun med Places-søgning: man søger (fx "Hoa Lo Prison") og vælger et resultat, og appen gemmer `lat`, `lng`, `google_place_id` og `google_maps_url`. Man kan ikke taste koordinater ind. Hoteller og aktiviteter uden placering står under kortet som "Mangler placering" med en knap, der åbner søgningen.
