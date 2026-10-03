# Beslutningslog — Vietnam 2026

Løbende log over hvad vi gør og hvorfor. Nyeste øverst. Opdateres i samme commit som koden.

Format pr. post:
- **Hvad:** den konkrete ændring
- **Hvorfor:** begrundelsen
- **Forkastet:** alternativer vi fravalgte, og hvorfor
- **Status:** bygget / verificeret / udestår

═══════════════════════════════════════════════════════════════════
## 2026-10-03

### Den endelige rejseplan: Ho Chi Minh, Regent Phu Quoc og Azerai
- **Hvad:** Ny datamigration `20261003120000_ny_plan.sql` (kun data, intet skema). Den fjerner den gamle plan:
  Hanoi med Aira, Six Senses med Cam Ranh-transport og nytårsmiddag, Holiday Inn og andre hotelkandidater. Den lægger
  den nye plan ind:
  - **Ho Chi Minh 27.–30. dec.:** hotel ikke valgt (status idé).
  - **Regent Phu Quoc 30. dec.–5. jan.:** booket, 6092079.
  - **Azerai Ke Ga Bay 5.–11. jan.:** booket, 2106044.
  - **Transport, 6 rækker:** fly ud (DAKEO5), SGN → PQC (ikke booket), PQC → SGN (ikke booket, VJ320 foretrukket),
    transfer til og fra Azerai, og fly hjem VN033 via München med noten om nedgraderingen.
  - **Destinationer:** Saigon (HCMC), Phu Quoc (Regent) og Ke Ga (Azerai).
  `supabase/seed.sql` og `scripts/seed.ts` indeholder nu samme plan, så en ny kørsel ikke bringer den gamle plan
  tilbage. Drift-testen forventer 3 destinationer, 3 hoteller, 6 transporter og ingen aktiviteter.
- **Felter uden egen kolonne:** bekræftelsesnumre, rate, check-in, transfer, nytårsprogram, betalingsfrister, adresse,
  telefon og e-mail står i `description`, som hotelsiden viser. Sengeønskerne står i `room_setup`, afbestilling i
  `cancellation_note`. Beløbene (VND-totaler, depositum, transferpris) står i `price_note`/`price_dkk`, som appen
  bevidst ikke viser (beslutningen "Priser fjernet fra appen").
- **Migrationens adfærd:** Alle hoteller og destinationer uden for den nye plan slettes, også aktiviteter på
  destinationer, der udgår. Transport erstattes helt. Azerai opdateres i stedet for at blive genskabt, så en placering
  sat i appen bevares. Den kan køres flere gange, og en afsluttende kontrol ruller alt tilbage, hvis resultatet ikke er
  præcis 3 destinationer, 3 hoteller og 6 transporter.
- **Forkastet:** at tilføje kolonner til bekræftelsesnummer, adresse og kontakt (opgaven sagde nej til skemaændringer).
  At gøre "Hotel i Ho Chi Minh City" til ingenting: et ophold med status idé holder tidslinjen og dag-fliserne
  27.–29. dec. på plads, og det kan omdøbes i appen, når hotellet er valgt.
- **Verificeret** i en midlertidig Postgres 16 med init, den gamle seed, rolle-migrationen og typiske app-rettelser
  (Azerai-placering, en Hanoi-aktivitet, en Saigon-aktivitet og et ekstra kandidathotel):
  - Migrationen fjernede alt gammelt og bevarede Saigon-aktiviteten og Azerai-placeringen. Anden kørsel ændrede intet.
    Resultatet var identisk i alle datakolonner med en frisk database seedet med den nye `seed.sql`.
  - I appen viste tidslinjen 3 blokke i datoorden (3/6/6 nætter) og 6 transport-etiketter. Dag-fliserne gik fra søn
    27. dec. til man 11. jan. Hotelsiderne viste bekræftelsesnumre, betaling og afbestilling, og ingen tekst fra den
    gamle plan stod nogen steder (også title-tekster).
  - Kortet kunne ikke ses uden Google-nøgle i sandkassen.
- **Også:** stedsøgningens eksempel "Hoa Lo Prison" (Hanoi) er skiftet til "Ben Thanh Market" i UI og README.

## 2026-09-29

### Ingen dag-flise for rejsens første dag (flyet ud)
- **Hvad:** Rejsens første dag er datoen for den første transport (`foersteRejsedag`, i dag flyet fra København
  26. dec.). Den dag får aldrig en dag-flise (`stayDays(stay, alleStays, foersteDag)`). Holiday Inn (26.–27. dec.)
  viser derfor kun opholdskortet, uden fliser og uden dagens "+ Aktivitet". Alle andre regler er uændrede: Hanoi
  starter stadig 27. dec., og Ke Ga har stadig 11. jan. Aktivitetens dato følger samme regel via
  `aktivitetsPeriode`, der bruges både af formularen (min/max på datofeltet) og af server-handlingen (Saigon kan nu
  kun få 27. dec.).
- **Hvorfor:** 26. dec. er en ren rejsedag; der planlægges intet den dag.
- **Forkastet:** at hårdkode 26. dec. Reglen følger den første transport, så den flytter med, hvis planen ændres.
  Afledt af tidslinjens startdato (`TRIP_START`) blev også fravalgt, fordi opgaven definerer dagen som flyets dato.
- **Uændret:** tidslinjen, kortet og databasen. Destinationens egen "+ Aktivitet i Saigon (HCMC)" under Ønsker er
  bevaret (den hører til destinationen, ikke til hotellets dage).
- **Verificeret:** 30 tests, lint, typecheck og build. I appen mod en midlertidig Postgres med begge migrationer og
  seed.sql: Holiday Inn har 0 fliser og 0 knapper; Hanoi har 3 fliser fra søn 27 dec, Six Senses 7 og Ke Ga 6 (til
  11 jan). Tidslinjen har uændret 4 blokke og 7 transport-etiketter. Saigon-formularens datofelt har min og max
  27. dec. En gennemtvunget 26. dec. blev afvist af serveren ("datoen skal ligge mellem 2026-12-27 og 2026-12-27"),
  og intet blev gemt.

### Dage under hvert hotel (kalenderfliser)
- **Hvad:** Under hvert hotel i oversigtens destinationsliste vises opholdets dage som kalenderfliser ("tor / 31 / dec").
  `stayDays`: fra check-in til og med dagen før check-ud. Rejsens sidste ophold (senest check-ud, i dag Ke Ga) får
  også check-ud-dagen (11. jan.), da ingen andre ophold dækker den. Hver dag viser aktiviteterne med den dato
  (`activitiesForDay`: morgen, formiddag, eftermiddag, aften, derefter uden tid; ens tid alfabetisk). Hver dag har en
  "+ Aktivitet"-knap, der åbner formularen med destination og dato forvalgt (`?destination=…&dato=…`). En tom dag
  viser kun flisen og knappen. "Ønsker" er bevaret under dagene; oversigtens "Planlagt"-liste er fjernet. Mobil: én
  dag pr. række med aktiviteterne til højre for flisen. Desktop: gitter.
- **Valg:** En dag viser ALLE aktiviteter med den dato, ikke kun destinationens egne. Destinationens datointerval
  inkluderer check-ud-dagen, så fx en Saigon-aktivitet 27. dec. ville ellers forsvinde, fordi 27. dec. er Hanois flise.
- **Uændret:** tidslinjen og kortet. Hotelsiden beholder sine Planlagt/Ønsker-lister (ændringen gjaldt oversigten).

### Roller: redaktør og læser
- **Hvad:** Migration `20260929130000_roller.sql` (IKKE kørt). Den tilføjer `profiles` (user_id, email, role
  'redaktør' | 'læser', default 'læser') og en trigger på `auth.users`, der giver nye brugere en profil som læser.
  Mads og Marie bliver redaktør, øvrige eksisterende brugere læser; mangler en af de to e-mails, kommer der en notice
  uden fejl. Den tilføjer også `kan_redigere()` (security definer, `search_path = ''`, false når profilen mangler)
  og ny RLS: alle indloggede må læse de fire tabeller, men insert/update/delete kræver `kan_redigere()`. På
  `profiles` må man kun læse sin egen række, og insert/update/delete er både uden politik og revoked for
  anon/authenticated. Roller ændres kun i Table Editor.
- **App:** `hentAdgang()` læser egen profil (manglende række eller fejl = læser, og fejlen vises med årsag). Topbar,
  oversigt, tidslinje, "Mangler placering", hotel- og aktivitetssider skjuler tilføj/ret/slet/Søg placering for
  læsere. Tidslinjens transport-etiketter linker til redigeringen; for læsere er de samme etiketter uden link. Alle
  ny/ret-sider sender læsere til `/`. Hver server action tjekker rollen og returnerer "du har kun læseadgang".
- **RLS afviser uden fejl:** en blokeret update/delete ændrer bare 0 rækker. Slet-handlingerne, transport-update,
  hotel/aktivitet-update og "sæt placering" tjekker nu antallet af ændrede rækker og viser en fejl i stedet for at
  lade det ligne succes.
- **Forkastet (efter afklaring):** en admin-rolle med brugeradministration i appen og brug af service role-nøglen.
  Brugere oprettes og roller sættes i Supabase-dashboardet, så appen skal aldrig kende nøglen.
- **Verificeret:** i en midlertidig Postgres 16 med init + seed.sql + rolle-migrationen. Mads (e-mail med store
  bogstaver) blev redaktør og gæsten læser; notice for manglende Marie, og nye brugere får læser via triggeren.
  - Læser og bruger uden profil: `kan_redigere()` = false; insert afvist af RLS; update/delete ændrer 0 rækker;
    ændring af profiles giver "permission denied".
  - Redaktør: insert/update/delete virker, men egen rolle kan ikke ændres. Anon: 0 rækker og ingen adgang til
    `kan_redigere()`.
  - Appen i Chromium som redaktør og som læser: fliser pr. hotel 1/3/7/6 (lør 26 dec … man 11 jan), 31. dec. sorteret
    morgen → aften → uden tid, ingen "Planlagt". Dag-knappen forvælger destination og dato.
  - Læseren så ingen redigeringsknapper, blev sendt til `/` fra alle seks ny/ret-sider og fik "du har kun
    læseadgang", da en server action blev kaldt med læserens session (databasen var uændret).
- **Teknisk lærdom:** min lokale stub af `auth.uid()` læste kun `request.jwt.claim.sub`. PostgREST 12 sætter
  `request.jwt.claims` (JSON), så redaktøren så læser-UI. Appen fejlede altså korrekt lukket. Supabase' egen
  `auth.uid()` læser begge, så det var kun et testopsætnings-problem.

### Priser fjernet fra appen
- **Hvad:** Appen viser og redigerer ikke længere priser. Fjernet: den samlede pris nederst på oversigten (inkl.
  "poster uden pris"), pris og prisnote på hotelkort, hotelside, aktivitetsliste og aktivitetsside, og felterne
  `price_dkk`/`price_note` i formularerne for hotel, transport og aktivitet. `src/lib/trip/prices.ts` (`priceTotal`,
  `formatDkk`, `parseBelob`) er slettet sammen med dens tests og de tilhørende CSS-klasser (`.total`, `.akt-liste .pris`).
  Tidslinjen viste ingen priser, heller ikke i transport-etiketternes hover-tekst, så den er uændret.
- **Hvorfor:** Vi vil ikke se eller indtaste priser nogen steder i appen.
- **Databasen er uændret:** kolonnerne `price_dkk` og `price_note` og deres data bevares, så der er ingen migration.
  Server-handlingerne (`src/app/actions.ts`) sender derfor slet ikke prisfelterne med i insert/update. At sende
  dem tomme ville overskrive de gemte priser, hver gang et hotel, en transport eller en aktivitet gemmes. Nye rækker
  får kolonnernes defaults (`price_dkk` null, `price_note` ''). Typerne i `src/lib/types.ts` beholder felterne, fordi
  de spejler databasen. `supabase/seed.sql` og `scripts/seed.ts` er urørte og indsætter fortsat priserne.
- **Forkastet:** at droppe kolonnerne (kræver migration og sletter data), og at skjule felterne med CSS (de ville
  stadig blive sendt og kunne overskrive data).
- **Verificeret:** tests (19, inkl. seed-drift-testen), lint, typecheck og build er grønne. I appen mod en midlertidig
  Postgres med migration og seed.sql: ingen prisfelter og ingen pristekst (heller ikke i title-/hover-tekster) på
  oversigt, hotel- og aktivitetsside eller nogen formular. Efter at have gemt en rettet hotel-, aktivitets- og
  transportformular står priserne uændret i databasen (Six Senses 167212 + prisnote, galamiddag 10908, VJ138 2357).
  En ny aktivitet oprettes med tom pris.

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

### Priser: ukendt er ikke 0 (appens prisvisning og prissum er fjernet, se "Priser fjernet fra appen" ovenfor; seed-data er uændret)
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
