-- Seed: den aktuelle rejseplan (den endelige plan fra 3. okt. 2026). Samme data som scripts/seed.ts.
--
-- Sådan (ny database): kør FØRST migrationen (supabase/migrations/20260929120000_init.sql),
-- opret de to brugere, og kopiér så HELE denne fil ind i Supabase → SQL Editor → Run.
-- En database med den gamle plan opdateres i stedet med
-- supabase/migrations/20261003120000_ny_plan.sql.
--
-- Idempotent på samme måde som scripts/seed.ts: hver række findes på sin
-- naturlige nøgle og indsættes KUN hvis den mangler. Eksisterende rækker røres
-- aldrig, så placeringer og rettelser lavet i appen overskrives ikke.
--   destinations: name
--   stays:        name
--   transport:    date + kind + from_place + to_place
--
-- destination_id slås op på destinationens navn — ingen hårdkodede UUID'er.
-- Planen har ingen aktiviteter; dem tilføjer I i appen.
--
-- Opholdene seedes UDEN koordinater; placeringen sættes i appen via Places.
-- Alt kører i én transaktion: fejler noget, indsættes intet.

begin;

-- ── Destinationer ─────────────────────────────────────────────────────────
insert into public.destinations (name, area, color, sort_order)
select v.name, v.area, v.color, v.sort_order
from (values
  ('Saigon (HCMC)',     'Ho Chi Minh City',              '#7E6699', 1),
  ('Phu Quoc (Regent)', 'Duong Bao, Phu Quoc',           '#4F8C8B', 2),
  ('Ke Ga (Azerai)',    'Ke Ga Bay, syd for Phan Thiet', '#B9788F', 3)
) as v (name, area, color, sort_order)
where not exists (select 1 from public.destinations d where d.name = v.name);

-- ── Hoteller ──────────────────────────────────────────────────────────────
insert into public.stays (
  destination_id, name, check_in, check_out, room_setup, description,
  website_url, price_dkk, price_note, cancellation_note, status
)
select d.id, v.name, v.check_in, v.check_out, v.room_setup, v.description,
       v.website_url, v.price_dkk, v.price_note, v.cancellation_note, v.status
from (values
  (
    'Saigon (HCMC)',
    'Hotel i Ho Chi Minh City (ikke valgt endnu)',
    date '2026-12-27', date '2026-12-30',
    '',
    'Hotellet er ikke valgt endnu. 3 nætter.',
    null::text,
    null::numeric,
    '',
    '',
    'idé'
  ),
  (
    'Phu Quoc (Regent)',
    'Regent Phu Quoc',
    date '2026-12-30', date '2027-01-05',
    '2 forbundne Ocean View Suites (én king, én twin)',
    'Bekræftelsesnummer: 6092079
Rate: Best Flexible Member Exclusive Rate. Daglig morgenmad i Rice Market og Refreshment Gallery inkluderet.
Betaling: fuld betaling senest 2. dec. 2026 (hotellet sender et betalingslink 28 dage før ankomst). Bookingen er garanteret med kreditkort.
Check-in kl. 15:00. Medbring det fysiske kreditkort, der er brugt som garanti.
Lufthavnstransfer: Mercedes-Benz Viano til 6 med bagage. Ikke bekræftet endnu – hotellet skal have vores flynumre.
Nytårsprogram: ikke offentliggjort af hotellet endnu.
Adresse: Phu Quoc Marina Integrated Resort Complex, Duong Bao Ward, Phu Quoc Special Zone, An Giang, Vietnam
Telefon: resort +84 297 388 0000, reservationer +84 28 7301 1800
E-mail: reservations.regentpq@ihg.com',
    'https://phuquoc.regenthotels.com',
    null,
    'I alt VND 459.621.300 (ca. USD 17.344). Lufthavnstransfer: VND 1.360.800 pr. bil pr. vej.',
    'Gratis afbestilling indtil kl. 18:00 vietnamesisk tid den 2. dec. 2026. Derefter mistes hele depositummet.',
    'booket'
  ),
  (
    'Ke Ga (Azerai)',
    'Azerai Ke Ga Bay',
    date '2027-01-05', date '2027-01-11',
    '2 Pool Villas med plungepool (130 m²). Ønsket sengeopsætning (afventer resortets bekræftelse): Villa 1 – kingsize-seng til Marie og de to yngste. Villa 2 – to separate senge til den 16- og 14-årige plus ekstraseng til Mads.',
    'Stille, elegant resort i en 4,5 hektar stor have ved en 5 km lang hvid sandstrand med udsigt til Ke Ga-fyret. Tre poolområder, spa og yoga. Michelin Key 2025.

Reservationsnummer: 2106044
Rate: Flexible – Super Early Bird. Daglig morgenmad inkluderet.
Sen check-ud til kl. 18:00 den 11. jan. (inkluderet i prisen).
Private transfers inkluderet: SGN-lufthavnen → resortet 5. jan. og resortet → SGN-lufthavnen 11. jan. (resortet anbefaler afgang ca. kl. 16:00).
Betaling: 50 % depositum senest 5. okt. 2026 via OnePay. Resten senest 29. dec. 2026 (resortet sender et link).
Check-in kl. 14:00.
Adresse: Hon Lan Area, Tan Thanh Commune, Lam Dong Province, Vietnam
Telefon: +84 252 3682 222, hotline +84 889 02 07 07
E-mail: reservations.kegabay@azerai.com',
    'https://azerai.com',
    35950,
    'I alt VND 145.580.627 (ca. 35.950 kr.). Depositum VND 72.790.313 senest 5. okt. 2026 via OnePay. Rest VND 72.790.314 den 29. dec. 2026.',
    'Gratis ændring af datoer og værelser indtil 7 dage før ankomst (29. dec. 2026); prisen genberegnes ved nye datoer. Afbestilling inden for 7 dage før ankomst koster 100 %.',
    'booket'
  )
) as v (
  destination, name, check_in, check_out, room_setup, description,
  website_url, price_dkk, price_note, cancellation_note, status
)
join public.destinations d on d.name = v.destination
where not exists (select 1 from public.stays s where s.name = v.name);

-- ── Transport ─────────────────────────────────────────────────────────────
insert into public.transport (
  date, kind, from_place, to_place, departs_at, arrives_at, carrier_and_number, description, status
)
select v.date, v.kind, v.from_place, v.to_place, v.departs_at, v.arrives_at,
       v.carrier_and_number, v.description, v.status
from (values
  (date '2026-12-26', 'fly', 'København', 'Ho Chi Minh City (SGN)',
   time '10:50', time '04:30', 'Vietnam Airlines', 'Booking-reference DAKEO5. Lander i SGN 27. dec. kl. 04:30.', 'booket'),
  (date '2026-12-30', 'fly', 'Ho Chi Minh City (SGN)', 'Phu Quoc (PQC)',
   null, null, '', 'Indenrigsfly. Ikke booket endnu.', 'idé'),
  (date '2027-01-05', 'fly', 'Phu Quoc (PQC)', 'Ho Chi Minh City (SGN)',
   time '11:05', time '12:10', 'Vietjet VJ320', 'Ikke booket endnu. Foretrukket: Vietjet VJ320 kl. 11:05–12:10.', 'idé'),
  (date '2027-01-05', 'bil', 'Ho Chi Minh City (SGN)', 'Azerai Ke Ga Bay',
   null, null, 'Privat transfer (Azerai)', 'Ca. 3 timer. Arrangeres af resortet og er inkluderet i Azerai-bookingen.', 'booket'),
  (date '2027-01-11', 'bil', 'Azerai Ke Ga Bay', 'Ho Chi Minh City (SGN)',
   time '16:00', null, 'Privat transfer (Azerai)', 'Inkluderet i Azerai-bookingen. Resortet anbefaler afgang ca. kl. 16:00. Sen check-ud til kl. 18:00.', 'booket'),
  (date '2027-01-11', 'fly', 'Ho Chi Minh City (SGN)', 'København via München',
   time '22:45', null, 'Vietnam Airlines VN033', 'Booking-reference DAKEO5. Vietnam Airlines har nedgraderet os fra premium economy til economy på VN033. Vi har ikke accepteret det og afventer deres svar.', 'booket')
) as v (date, kind, from_place, to_place, departs_at, arrives_at, carrier_and_number, description, status)
where not exists (
  select 1 from public.transport t
  where t.date = v.date and t.kind = v.kind and t.from_place = v.from_place and t.to_place = v.to_place
);

-- ── Kontrol: alt fra planen findes nu. Ellers rulles hele transaktionen tilbage. ──
do $$
declare
  mangler text;
begin
  select string_agg(n, ', ') into mangler
  from (values ('Saigon (HCMC)'), ('Phu Quoc (Regent)'), ('Ke Ga (Azerai)')) as v (n)
  where not exists (select 1 from public.destinations d where d.name = v.n);
  if mangler is not null then
    raise exception 'Seed fejlede: destinationer mangler efter kørslen: %', mangler;
  end if;

  select string_agg(n, ', ') into mangler
  from (values ('Hotel i Ho Chi Minh City (ikke valgt endnu)'), ('Regent Phu Quoc'), ('Azerai Ke Ga Bay')) as v (n)
  where not exists (select 1 from public.stays s where s.name = v.n);
  if mangler is not null then
    raise exception 'Seed fejlede: hoteller mangler efter kørslen: %', mangler;
  end if;

  if (select count(*) from public.transport where date between date '2026-12-26' and date '2027-01-11') < 6 then
    raise exception 'Seed fejlede: der er færre end 6 transporter efter kørslen.';
  end if;

  raise notice 'Seed færdig: alle destinationer, hoteller og transporter findes.';
end;
$$;

commit;
