-- Migration: den nye, endelige rejseplan (kun data, intet skema).
--   26. dec.         Fly København → Ho Chi Minh City (booket, DAKEO5)
--   27.–30. dec.     Ho Chi Minh City, hotel ikke valgt
--   30. dec.         Fly Ho Chi Minh City → Phu Quoc (ikke booket)
--   30. dec.–5. jan. Regent Phu Quoc (booket, 6092079)
--   5. jan.          Fly Phu Quoc → Ho Chi Minh City (ikke booket) + transfer til Ke Ga
--   5.–11. jan.      Azerai Ke Ga Bay (booket, 2106044)
--   11. jan.         Transfer til SGN + fly hjem VN033 via München (booket, DAKEO5)
--
-- Fjerner alt fra den gamle plan: Hanoi (Aira), Six Senses Ninh Van Bay, Holiday Inn,
-- Cam Ranh-transport, nytårsmiddagen på Six Senses og andre hotelkandidater.
-- Felter uden egen kolonne (bekræftelsesnumre, adresse, kontakt, check-in, transfer,
-- betalingsfrister) står i description. Beløb står i price_note/price_dkk, som appen
-- ikke viser.
--
-- Kan køres flere gange: resultatet er det samme. Placeringer (lat/lng) på Azerai bevares.
-- Kør i Supabase → SQL Editor. Alt sker i én transaktion.

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

update public.destinations set area = 'Ho Chi Minh City', sort_order = 1 where name = 'Saigon (HCMC)';
update public.destinations set sort_order = 2 where name = 'Phu Quoc (Regent)';
update public.destinations set sort_order = 3 where name = 'Ke Ga (Azerai)';

-- ── Aktiviteter og hoteller fra den gamle plan ───────────────────────────
-- Aktiviteter på destinationer, der udgår (fx nytårsmiddagen på Six Senses).
delete from public.activities a
using public.destinations d
where a.destination_id = d.id
  and d.name not in ('Saigon (HCMC)', 'Phu Quoc (Regent)', 'Ke Ga (Azerai)');

-- Alle hoteller, der ikke er i den nye plan (Holiday Inn, Aira, Six Senses og andre kandidater).
delete from public.stays
where name not in ('Hotel i Ho Chi Minh City (ikke valgt endnu)', 'Regent Phu Quoc', 'Azerai Ke Ga Bay');

delete from public.destinations
where name not in ('Saigon (HCMC)', 'Phu Quoc (Regent)', 'Ke Ga (Azerai)');

-- ── Hoteller i den nye plan ──────────────────────────────────────────────
-- Først oprettes de, der mangler (kun nøglefelter); derefter sætter én update pr. hotel alle felter.
insert into public.stays (destination_id, name, check_in, check_out)
select d.id, v.name, v.check_in, v.check_out
from (values
  ('Saigon (HCMC)',     'Hotel i Ho Chi Minh City (ikke valgt endnu)', date '2026-12-27', date '2026-12-30'),
  ('Phu Quoc (Regent)', 'Regent Phu Quoc',                              date '2026-12-30', date '2027-01-05'),
  ('Ke Ga (Azerai)',    'Azerai Ke Ga Bay',                             date '2027-01-05', date '2027-01-11')
) as v (destination, name, check_in, check_out)
join public.destinations d on d.name = v.destination
where not exists (select 1 from public.stays s where s.name = v.name);

update public.stays s
set destination_id = d.id,
    check_in = date '2026-12-30',
    check_out = date '2027-01-05',
    status = 'booket',
    room_setup = '2 forbundne Ocean View Suites (én king, én twin)',
    description = 'Bekræftelsesnummer: 6092079
Rate: Best Flexible Member Exclusive Rate. Daglig morgenmad i Rice Market og Refreshment Gallery inkluderet.
Betaling: fuld betaling senest 2. dec. 2026 (hotellet sender et betalingslink 28 dage før ankomst). Bookingen er garanteret med kreditkort.
Check-in kl. 15:00. Medbring det fysiske kreditkort, der er brugt som garanti.
Lufthavnstransfer: Mercedes-Benz Viano til 6 med bagage. Ikke bekræftet endnu – hotellet skal have vores flynumre.
Nytårsprogram: ikke offentliggjort af hotellet endnu.
Adresse: Phu Quoc Marina Integrated Resort Complex, Duong Bao Ward, Phu Quoc Special Zone, An Giang, Vietnam
Telefon: resort +84 297 388 0000, reservationer +84 28 7301 1800
E-mail: reservations.regentpq@ihg.com',
    website_url = 'https://phuquoc.regenthotels.com',
    extra_url = null,
    extra_url_label = null,
    price_dkk = null,
    price_note = 'I alt VND 459.621.300 (ca. USD 17.344). Lufthavnstransfer: VND 1.360.800 pr. bil pr. vej.',
    cancellation_note = 'Gratis afbestilling indtil kl. 18:00 vietnamesisk tid den 2. dec. 2026. Derefter mistes hele depositummet.'
from public.destinations d
where d.name = 'Phu Quoc (Regent)' and s.name = 'Regent Phu Quoc';

update public.stays s
set destination_id = d.id,
    check_in = date '2027-01-05',
    check_out = date '2027-01-11',
    status = 'booket',
    room_setup = '2 Pool Villas med plungepool (130 m²). Ønsket sengeopsætning (afventer resortets bekræftelse): Villa 1 – kingsize-seng til Marie og de to yngste. Villa 2 – to separate senge til den 16- og 14-årige plus ekstraseng til Mads.',
    description = 'Stille, elegant resort i en 4,5 hektar stor have ved en 5 km lang hvid sandstrand med udsigt til Ke Ga-fyret. Tre poolområder, spa og yoga. Michelin Key 2025.

Reservationsnummer: 2106044
Rate: Flexible – Super Early Bird. Daglig morgenmad inkluderet.
Sen check-ud til kl. 18:00 den 11. jan. (inkluderet i prisen).
Private transfers inkluderet: SGN-lufthavnen → resortet 5. jan. og resortet → SGN-lufthavnen 11. jan. (resortet anbefaler afgang ca. kl. 16:00).
Betaling: 50 % depositum senest 5. okt. 2026 via OnePay. Resten senest 29. dec. 2026 (resortet sender et link).
Check-in kl. 14:00.
Adresse: Hon Lan Area, Tan Thanh Commune, Lam Dong Province, Vietnam
Telefon: +84 252 3682 222, hotline +84 889 02 07 07
E-mail: reservations.kegabay@azerai.com',
    website_url = 'https://azerai.com',
    extra_url = null,
    extra_url_label = null,
    price_dkk = 35950,
    price_note = 'I alt VND 145.580.627 (ca. 35.950 kr.). Depositum VND 72.790.313 senest 5. okt. 2026 via OnePay. Rest VND 72.790.314 den 29. dec. 2026.',
    cancellation_note = 'Gratis ændring af datoer og værelser indtil 7 dage før ankomst (29. dec. 2026); prisen genberegnes ved nye datoer. Afbestilling inden for 7 dage før ankomst koster 100 %.'
from public.destinations d
where d.name = 'Ke Ga (Azerai)' and s.name = 'Azerai Ke Ga Bay';

update public.stays s
set destination_id = d.id, check_in = date '2026-12-27', check_out = date '2026-12-30', status = 'idé',
    room_setup = '', description = 'Hotellet er ikke valgt endnu. 3 nætter.',
    website_url = null, extra_url = null, extra_url_label = null,
    price_dkk = null, price_note = '', cancellation_note = ''
from public.destinations d
where d.name = 'Saigon (HCMC)' and s.name = 'Hotel i Ho Chi Minh City (ikke valgt endnu)';

-- ── Transport: hele listen erstattes af den nye plan ─────────────────────
delete from public.transport;

insert into public.transport (date, kind, from_place, to_place, departs_at, arrives_at, carrier_and_number, description, status)
values
  (date '2026-12-26', 'fly', 'København', 'Ho Chi Minh City (SGN)', time '10:50', time '04:30',
   'Vietnam Airlines', 'Booking-reference DAKEO5. Lander i SGN 27. dec. kl. 04:30.', 'booket'),
  (date '2026-12-30', 'fly', 'Ho Chi Minh City (SGN)', 'Phu Quoc (PQC)', null, null,
   '', 'Indenrigsfly. Ikke booket endnu.', 'idé'),
  (date '2027-01-05', 'fly', 'Phu Quoc (PQC)', 'Ho Chi Minh City (SGN)', time '11:05', time '12:10',
   'Vietjet VJ320', 'Ikke booket endnu. Foretrukket: Vietjet VJ320 kl. 11:05–12:10.', 'idé'),
  (date '2027-01-05', 'bil', 'Ho Chi Minh City (SGN)', 'Azerai Ke Ga Bay', null, null,
   'Privat transfer (Azerai)', 'Ca. 3 timer. Arrangeres af resortet og er inkluderet i Azerai-bookingen.', 'booket'),
  (date '2027-01-11', 'bil', 'Azerai Ke Ga Bay', 'Ho Chi Minh City (SGN)', time '16:00', null,
   'Privat transfer (Azerai)', 'Inkluderet i Azerai-bookingen. Resortet anbefaler afgang ca. kl. 16:00. Sen check-ud til kl. 18:00.', 'booket'),
  (date '2027-01-11', 'fly', 'Ho Chi Minh City (SGN)', 'København via München', time '22:45', null,
   'Vietnam Airlines VN033', 'Booking-reference DAKEO5. Vietnam Airlines har nedgraderet os fra premium economy til economy på VN033. Vi har ikke accepteret det og afventer deres svar.', 'booket');

-- ── Kontrol: præcis den nye plan, ellers rulles alt tilbage ──────────────
do $$
declare
  n_dest int; n_stays int; n_transport int; mangler text;
begin
  select count(*) into n_dest from public.destinations;
  select count(*) into n_stays from public.stays;
  select count(*) into n_transport from public.transport;
  select string_agg(n, ', ') into mangler
  from (values ('Hotel i Ho Chi Minh City (ikke valgt endnu)'), ('Regent Phu Quoc'), ('Azerai Ke Ga Bay')) as v (n)
  where not exists (select 1 from public.stays s where s.name = v.n);
  if mangler is not null then
    raise exception 'Ny plan fejlede: hoteller mangler: %', mangler;
  end if;
  if n_dest <> 3 or n_stays <> 3 or n_transport <> 6 then
    raise exception 'Ny plan fejlede: forventede 3 destinationer, 3 hoteller og 6 transporter, fandt %, % og %.',
      n_dest, n_stays, n_transport;
  end if;
  raise notice 'Ny plan er lagt ind: 3 destinationer, 3 hoteller, 6 transporter.';
end;
$$;

commit;
