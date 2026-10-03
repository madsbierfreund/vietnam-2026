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
- `supabase/migrations/20260929130000_roller.sql` — roller: `profiles`, `kan_redigere()`, trigger for nye brugere, RLS hvor kun redaktører må skrive
- `supabase/migrations/20261003120000_ny_plan.sql` — kun data: skifter en database med den gamle plan (Hanoi, Six Senses) til den endelige plan (Ho Chi Minh, Regent Phu Quoc, Azerai)
- `supabase/migrations/20261003130000_hotel_des_arts.sql` — kun data: erstatter pladsholderen for hotellet i Ho Chi Minh City med Hôtel des Arts Saigon – MGallery
- `supabase/seed.sql` — idempotent seed af den nuværende plan til Supabase SQL Editor (den primære vej)
- `scripts/seed.ts` — samme seed som script (`npm run seed`), til hvis man kører lokalt. `src/lib/seed.test.ts` sikrer, at de to indeholder de samme destinationer, hoteller og transporter
- `src/proxy.ts`, `src/lib/supabase/*` — session og login-beskyttelse (alt undtagen `/login` kræver login)
- `src/lib/rolle.ts`, `src/lib/adgang.ts` — roller (redaktør/læser) og opslag af den indloggede brugers rolle
- `src/lib/trip/*` — ren logik uden UI: datoer og nætter, tidslinjens geometri, nærmeste destination, ruten, aktivitetslister (testet i `trip.test.ts`)
- `src/lib/data.ts` — hentning i server-komponenter; fejl vises med Supabase' egen årsag
- `src/app/actions.ts` — alle skrivninger (server actions)
- `src/components/` — oversigt, tidslinje, destinationsliste, formularer, kort (`maps/`)
- `src/app/` — sider: `/`, `/login`, `/hotel/[id]`, `/hotel/ny`, `/hotel/[id]/rediger`, `/aktivitet/[id]`, `/aktivitet/ny`, `/aktivitet/[id]/rediger`, `/transport/ny`, `/transport/[id]`
- `docs/beslutningslog.md` — hvad vi har besluttet og hvorfor

## Opsætning

Alt kan gøres i browseren: Supabase-dashboardet, Google Cloud Console og Vercel. Intet skal køres lokalt.
Rækkefølgen i trin 2–4b er vigtig: **migration → brugere → seed → rolle-migration**.

### 1. Supabase-projekt

1. Opret et nyt projekt på [supabase.com](https://supabase.com).
2. Under **Authentication → Sign In / Providers**: behold **Email** slået til, og slå **Allow new users to sign up** FRA (ingen offentlig tilmelding).
3. Under **Project Settings → API** finder du `Project URL` og `anon`-nøglen (bruges i trin 7).

### 2. Kør migrationen (én gang)

Åbn **SQL Editor → New query**, kopiér HELE indholdet af `supabase/migrations/20260929120000_init.sql` ind, og tryk **Run**.
Den opretter tabellerne og adgangsreglerne. Den må kun køres én gang (en ny kørsel fejler med "already exists").

### 3. Opret de to brugere

**Authentication → Users → Add user → Create new user**: indtast e-mail og adgangskode, og sæt flueben i **Auto Confirm User**. Gør det for Mads og for Marie. Der er ingen admin-side i appen.

### 4. Seed rejseplanen

Åbn **SQL Editor → New query**, kopiér HELE indholdet af `supabase/seed.sql` ind, og tryk **Run**.

- Den indsætter den endelige plan: destinationer (Ho Chi Minh, Phu Quoc, Ke Ga), hoteller (uden koordinater) og transport, i én transaktion. Fejler noget, indsættes intet.
- Den er idempotent: en post, der allerede findes, springes over og røres ikke. Det gælder samme navn, for transport samme dato/type/fra/til, og for aktiviteter samme destination + titel. Den kan altså køres igen uden dubletter, og rettelser I har lavet i appen (fx placeringer) overskrives aldrig.
- Til sidst kontrollerer den, at hele planen findes, og skriver "Seed færdig …". Står der `relation "public.destinations" does not exist`, er migrationen (trin 2) ikke kørt.

*Alternativ for den, der kører lokalt:* `npm run seed` (`scripts/seed.ts`) indsætter præcis de samme data. Det kræver `NEXT_PUBLIC_SUPABASE_URL` og `SUPABASE_SERVICE_ROLE_KEY` i `.env.local`.

### 4b. Kør rolle-migrationen (én gang)

Åbn **SQL Editor → New query**, kopiér HELE indholdet af `supabase/migrations/20260929130000_roller.sql` ind, og tryk **Run**.

- Den opretter `profiles` og giver eksisterende brugere en rolle: `madsbierfreund@gmail.com` og `marie.vedsted@gmail.com` bliver **redaktør**, alle andre **læser**.
- Findes en af de to e-mails ikke endnu, skriver den en notice med e-mailen, men fejler ikke. Opret så brugeren og sæt rollen til `redaktør` i Table Editor (se "Brugere og roller" nedenfor).
- Herefter må kun redaktører oprette, rette og slette. Alle indloggede kan se alt.

### 4c. Opdatér en eksisterende database til den endelige plan

Har databasen den gamle plan (Hanoi, Six Senses, Holiday Inn), så åbn **SQL Editor → New query**, kopiér HELE indholdet af `supabase/migrations/20261003120000_ny_plan.sql` ind, og tryk **Run**.

- Den fjerner den gamle plan (også aktiviteter på de destinationer, der udgår) og lægger den endelige plan ind. Transport erstattes helt.
- Den kan køres igen uden at ændre resultatet, og den bevarer placeringen på Azerai.
- Den skriver "Ny plan er lagt ind …". Ellers ruller den alt tilbage med en fejl, der siger, hvad der mangler.
- Kør derefter trin 4d. Kør ikke `ny_plan.sql` igen efter 4d: den ville sætte pladsholderen for Ho Chi Minh-hotellet tilbage.

### 4d. Hotellet i Ho Chi Minh City

Har databasen pladsholderen "Hotel i Ho Chi Minh City (ikke valgt endnu)", så åbn **SQL Editor → New query**, kopiér HELE indholdet af `supabase/migrations/20261003130000_hotel_des_arts.sql` ind, og tryk **Run**.

- Den gør pladsholderen til Hôtel des Arts Saigon – MGallery, 27.–30. dec. Intet andet i planen ændres.
- Den kan køres igen uden at ændre resultatet. Den skriver "Hôtel des Arts Saigon – MGallery er lagt ind …", ellers ruller den alt tilbage.
- En ny database seedet med `seed.sql` har allerede hotellet og skal ikke have trin 4c eller 4d.

### 5. Google Cloud

1. Opret (eller vælg) et projekt i [Google Cloud Console](https://console.cloud.google.com), og tilknyt en faktureringskonto.
2. **APIs & Services → Library**: slå **Maps JavaScript API** og **Places API (New)** til.
3. **Google Maps Platform → Map management → Create Map ID**: type **JavaScript**, **Vector**. Kopiér Map ID'et (kræves til Advanced Markers).
4. **APIs & Services → Credentials → Create credentials → API key**. Under nøglens restriktioner:
   - *Application restrictions*: **Websites**, tilføj `https://<dit-vercel-domæne>/*` og `http://localhost:3000/*`.
   - *API restrictions*: begræns til **Maps JavaScript API** og **Places API (New)**.

### 6. Miljøvariabler

| Variabel | Hvor | Bruges af |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | appen (+ lokalt seed-script) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (`anon`) | appen |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Cloud → Credentials | appen (kort + stedsøgning) |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Google Maps Platform → Map management | appen (kort) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (`service_role`) | **kun** `scripts/seed.ts` lokalt |

`SUPABASE_SERVICE_ROLE_KEY` omgår RLS. Den har bevidst intet `NEXT_PUBLIC_`-præfiks og skal **ikke** lægges i Vercel. Bruger du `seed.sql`, skal den slet ikke bruges.

Mangler en Google-variabel, viser appen en besked med variablens navn i stedet for kortet; resten virker.

### 7. Deploy på Vercel

1. **Add New → Project** og importér `madsbierfreund/vietnam-2026`. Framework: Next.js (registreres automatisk).
2. Under **Environment Variables** tilføjer du de fire `NEXT_PUBLIC_*`-variabler (ikke service role-nøglen).
3. **Deploy**. Tilføj bagefter Vercel-domænet til API-nøglens *Website restrictions* i Google Cloud (trin 5).
4. I Supabase under **Authentication → URL Configuration**: sæt **Site URL** til Vercel-domænet.

### 8. Kør lokalt (valgfrit)

Kopiér `.env.example` til `.env.local` og udfyld den.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # enhedstests (inkl. at seed.sql og seed.ts er ens)
npm run lint
npm run typecheck
npm run build
```

## Brugere og roller

Der er ingen brugeradministration i appen. Alt gøres i Supabase-dashboardet.

- **redaktør** kan oprette, rette og slette alt.
- **læser** kan se alt: oversigt, tidslinje, kort, hotel- og aktivitetssider. Læsere ser ingen knapper til at tilføje, rette, slette eller søge placering, og ny/ret-siderne sender dem til oversigten.

**Tilføj en bruger:** **Authentication → Users → Add user → Create new user**. Indtast e-mail og adgangskode, og sæt flueben i **Auto Confirm User**. Brugeren får automatisk en række i `profiles` med rollen `læser`.

**Skift en rolle:** **Table Editor → profiles**. Find brugerens række, dobbeltklik på feltet `role`, skriv `redaktør` eller `læser`, og gem. Ændringen gælder fra brugerens næste sidevisning. Andre værdier afvises af databasen.

En bruger uden række i `profiles` behandles som læser. Rollen håndhæves i appen og til sidst af databasens RLS (`kan_redigere()`).

## Placeringer

Placeringer sættes kun med Places-søgning: man søger (fx "Ben Thanh Market") og vælger et resultat, og appen gemmer `lat`, `lng`, `google_place_id` og `google_maps_url`. Man kan ikke taste koordinater ind. Hoteller og aktiviteter uden placering står under kortet som "Mangler placering" med en knap, der åbner søgningen.
