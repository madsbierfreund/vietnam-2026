# Beslutningslog — Vietnam 2026

Løbende log over hvad vi gør og hvorfor. Nyeste øverst. Opdateres i samme commit som koden.

Format pr. post:
- **Hvad:** den konkrete ændring
- **Hvorfor:** begrundelsen
- **Forkastet:** alternativer vi fravalgte, og hvorfor
- **Status:** bygget / verificeret / udestår

═══════════════════════════════════════════════════════════════════
## 2026-09-29

### Seed som ren SQL til Supabase SQL Editor (`supabase/seed.sql`)
- **Hvad:** Ny `supabase/seed.sql` med præcis de samme data som `scripts/seed.ts`, i én transaktion. Den er
  idempotent efter samme nøgler (`insert … select … where not exists`): destinations/stays på navn, transport på
  dato + type + fra + til, activities på destination + titel. `destination_id` slås op på destinationsnavnet, der er
  ingen hårdkodede UUID'er. Til sidst kontrollerer en `do`-blok, at hele planen findes, og ruller ellers alt tilbage
  med en tydelig fejl. README gør SQL-filen til den primære vej (migration → brugere → seed.sql); `seed.ts` er beholdt
  som alternativ. Ny test `src/lib/seed.test.ts` trækker destinationer, hoteller (navn + datoer), transport (dato,
  type, fra, til) og aktiviteter (titel, dato, tid på dagen) ud af begge filer og kræver, at de er ens.
- **Hvorfor:** Brugeren kører intet lokalt, så `npm run seed` kan ikke bruges. Uden testen ville de to seeds glide fra
  hinanden ved næste ændring af planen.
- **`created_by`:** kolonnen er nullable (`uuid default auth.uid()`, ingen NOT NULL). SQL-filen sætter den derfor ikke,
  præcis som `seed.ts`. I SQL Editor er der ingen logget-ind bruger, så `auth.uid()` giver null. Der var ikke brug for
  at falde tilbage på den ældste bruger i `auth.users`.
- **Forkastet:** at generere SQL'en fra `seed.ts` ved build (en ekstra byggetrin for en fil, der sjældent ændres,
  og filen skal kunne læses og kopieres som den er). Upsert/`on conflict do update` ville overskrive rettelser lavet i appen.
- **Verificeret:** i en midlertidig Postgres 16 med den rigtige migration: første kørsel indsætter 4/4/7/1 rækker, og
  anden kørsel giver `INSERT 0 0` på alle fire. `seed.ts` (via PostgREST) i en anden database giver data, der er
  identiske med `seed.sql` i alle kolonner. `seed.sql` oven på `seed.ts` indsætter intet. En placering og pris rettet
  efter seed overlever en ny kørsel. Uden migrationen fejler den med `relation "public.destinations" does not exist`.
  Testen fejler som den skal, når en dato ændres i kun den ene fil.

### Første version af appen
- **Hvad:** Next.js 16 (App Router) + React 19 + TypeScript, Supabase (Auth + Postgres + RLS), Google Maps via
  `@vis.gl/react-google-maps`. Én migration (`20260929120000_init.sql`) med `destinations`, `stays`, `transport`,
  `activities`. Oversigt (tidslinje, kort, destinationsliste, prissum), detaljesider for hotel og aktivitet,
  formularer til hotel/transport/aktivitet, seed-script.
- **Hvorfor:** Samme stack og arbejdsform som Aktier og familieoverdragelse. Versionerne følger familieoverdragelse
  (Next 16, React 19, TS 6, Vitest); Supabase-mønstret (server/client/session-refresh) følger Aktier.
- **Status:** bygget. Verificeret lokalt: migrationen kørt i en midlertidig Postgres 16 med en Supabase-stub
  (RLS: anon ser 0 rækker og kan ikke skrive, authenticated har fuld CRUD, check-constraints og `updated_at`-trigger
  virker). Seed kørt to gange via PostgREST (anden kørsel: 0 indsat). Appen kørt i Chromium mod samme backend:
  login (forkert/korrekt), oversigt på mobil og desktop, opret/ret/slet aktivitet, transport-redigering, log ud.
  **Ikke** verificeret: selve Google-kortet og Places-søgningen (der er ingen API-nøgle i sandkassen). Kun
  beskeden om manglende miljøvariabler er set.

### Nætter afledes, gemmes aldrig
- **Hvad:** `nights()` = dage mellem `check_in` og `check_out`. "Hvilket ophold gælder natten" er `check_in <= dato < check_out`.
- **Hvorfor:** Én sandhed. En gemt nat-tæller ville kunne komme ud af trit med datoerne.

### Tidslinjens geometri
- **Hvad:** Aksen er de 18 rejsedage (26/12–12/1). Et ophold tegnes fra midt på check-in-dagen til midt på
  check-ud-dagen, så bredden er præcis `nætter / 18`, og blokkene støder op til hinanden. Transport placeres ved
  afgangstid (uden tid: midt på dagen). Aktiviteter placeres ved tid på dagen. Transport-etiketterne lægges på
  baner (`assignLanes`), så de ikke overlapper; hver viser kun tid og flynummer, og resten står i etikettens title.
  Nu-linjen beregnes kun i browseren.
- **Forkastet:** Dag-kolonner hvor blokken fylder hele check-in- til check-ud-dagen (bredden ville blive nætter + 1
  og ikke proportional). Grupperede transport-etiketter pr. dag: 26. og 27. dec. overlappede på skærmbilledet.

### Priser: ukendt er ikke 0
- **Hvad:** `price_dkk` er nullable. Summen tager kun kendte priser med og viser antallet af poster uden pris ved
  siden af. Et tomt prisfelt i en formular gemmes som null. Båd-transferen Cam Ranh → Six Senses seedes med
  `price_dkk = 0` og beskrivelsen "Inkluderet i Six Senses-prisen".
- **Hvorfor:** Transferen er ikke en ukendt pris. Den er kendt og koster 0 ekstra, fordi den er med i hotelprisen.
  Med null ville den fejlagtigt tælle som "uden pris".
- **Forkastet:** At lade den stå som null (ville puste "uden pris"-tallet op).

### Ruten på kortet
- **Hvad:** Ruten går gennem opholdene i check-in-rækkefølge og slutter i SGN. Et ben (ophold → næste) er
  stiplet, hvis transporten på check-ud-dagen omfatter et fly. På det sidste ben (→ SGN) tæller dagens sidste fly
  ikke med, for det er flyet hjem, som starter i lufthavnen.
- **Hvorfor:** Med de nuværende data bliver benene HCMC→Hanoi og Hanoi→Six Senses stiplede (fly), mens Six
  Senses→Ke Ga og Ke Ga→SGN er fuldt optrukne (bil/båd).
- **Forkastet:** "Rejsens sidste transport" som flyet hjem. Det fejlede i testen, fordi bilen uden afgangstid
  sorteres efter flyet kl. 22:45.
- **SGN** placeres ved kørsel med Places `searchByText`, ikke med hårdkodede koordinater. Fejler opslaget, vises
  fejlen med årsag på kortet.

### Placering kun via Places
- **Hvad:** Stedsøgning bygget på `AutocompleteSuggestion.fetchAutocompleteSuggestions` (Places API (New)) med
  session-token og begrænset til Vietnam (`includedRegionCodes: ['vn']`). Ved valg hentes `location`, `id` og
  `googleMapsURI`. Koordinater kan ikke tastes ind.
- **Forkastet:** Web-komponenten `PlaceAutocompleteElement`: svær at style efter designet og at styre fra React.

### Forvalg af destination for en ny aktivitet
- **Hvad:** `nearestDestinationId`: destinationen for det ophold, der ligger nærmest (haversine) blandt ophold
  MED placering. Datoen begrænses til destinationens periode (første check-in til sidste check-ud, begge
  inklusive). Det håndhæves både i formularen og i server-handlingen.
- **Hvorfor:** Check-ud-dagen er med, fordi man sagtens kan nå noget om morgenen, før man rejser videre.

### Formularer bevarer indtastning ved fejl
- **Hvad:** Server actions kaldes fra `onSubmit` via `startTransition` (`useFormular`), ikke via `<form action>`.
- **Hvorfor:** React 19 nulstiller en `<form action>` efter hver indsendelse, også når handlingen returnerer en
  fejl, så brugerens indtastning ville forsvinde.

### Seed er "indsæt hvis mangler"
- **Hvad:** Hver post slås op på en naturlig nøgle (navn; transport: dato + type + fra + til) og indsættes kun,
  hvis den mangler. Eksisterende rækker røres aldrig.
- **Hvorfor:** Idempotent, og placeringer og rettelser lavet i appen overskrives ikke ved en ny kørsel.
- **Forkastet:** Upsert. Det ville overskrive rettelser med seed-værdierne.

### Destinationsfarver
- **Hvad:** Saigon `#7E6699` (blomme), Hanoi `#B5735A` (ler), Ninh Van Bay `#4F8C8B` (havgrøn), Ke Ga `#B9788F` (rosa).
- **Hvorfor:** Dæmpede og lette at skelne fra hinanden. De ligger bevidst væk fra statusfarverne (grøn `#2e6b4f`,
  amber og grå) og fra blæk-blå `#1E3A5F`, som kun bruges til primære knapper og aktiv navigation.

## Tekniske lærdomme (kode-niveau)
- `tsconfig.json`: TypeScript 6 medtager ikke længere `@types/*` automatisk. `google`-namespacet manglede, indtil
  `"types": ["node", "google.maps"]` blev sat.
- Next 16: `middleware.ts` hedder nu `proxy.ts` (funktionen `proxy`), og `params`, `searchParams` og `cookies()` er async.
- `src/lib/trip/route.ts` `routeLegs`: sortering med `departs_at ?? '99'` lægger transport uden tid SIDST på dagen.
  Brug den ikke til at finde "sidste transport" (se ruten ovenfor).
