-- Seed: den aktuelle rejseplan. Samme data som scripts/seed.ts.
--
-- Sådan: kør FØRST migrationen (supabase/migrations/20260929120000_init.sql),
-- opret de to brugere, og kopiér så HELE denne fil ind i Supabase → SQL Editor → Run.
--
-- Idempotent på samme måde som scripts/seed.ts: hver række findes på sin
-- naturlige nøgle og indsættes KUN hvis den mangler. Eksisterende rækker røres
-- aldrig, så placeringer og rettelser lavet i appen overskrives ikke.
--   destinations: name
--   stays:        name
--   transport:    date + kind + from_place + to_place
--   activities:   destination_id + title
--
-- destination_id slås op på destinationens navn — ingen hårdkodede UUID'er.
-- activities.created_by er nullable og sættes ikke (som i seed.ts): i SQL
-- Editor er der ingen logget-ind bruger, så default auth.uid() giver null.
--
-- Opholdene seedes UDEN koordinater; placeringen sættes i appen via Places.
-- Alt kører i én transaktion: fejler noget, indsættes intet.

begin;

-- ── Destinationer ─────────────────────────────────────────────────────────
insert into public.destinations (name, area, color, sort_order)
select v.name, v.area, v.color, v.sort_order
from (values
  ('Saigon (HCMC)',             'Ho Chi Minh City, ved lufthavnen', '#7E6699', 1),
  ('Hanoi',                     'Hoan Kiem, ved Old Quarter',       '#B5735A', 2),
  ('Ninh Van Bay (Six Senses)', 'Ninh Van Bay, nord for Nha Trang', '#4F8C8B', 3),
  ('Ke Ga (Azerai)',            'Ke Ga Bay, syd for Phan Thiet',    '#B9788F', 4)
) as v (name, area, color, sort_order)
where not exists (select 1 from public.destinations d where d.name = v.name);

-- ── Hoteller ──────────────────────────────────────────────────────────────
insert into public.stays (
  destination_id, name, check_in, check_out, room_setup, description,
  website_url, extra_url, extra_url_label, price_dkk, price_note, cancellation_note, status
)
select d.id, v.name, v.check_in, v.check_out, v.room_setup, v.description,
       v.website_url, v.extra_url, v.extra_url_label, v.price_dkk, v.price_note, v.cancellation_note, v.status
from (values
  (
    'Saigon (HCMC)',
    'Holiday Inn & Suites Saigon Airport',
    date '2026-12-26', date '2026-12-27',
    '2 × 1 Bedroom Suite City View med sovesofa (56 m², maks. 3 personer pr. suite)',
    '5–10 minutter fra lufthavnen, så vi kan sove efter landingen kl. 04:30.',
    'https://www.ihg.com/holidayinn/hotels/us/en/ho-chi-minh-city/sgnsa/hoteldetail',
    null::text, null::text,
    2016::numeric,
    '',
    'Gratis afbestilling indtil 25. december.',
    'valgt'
  ),
  (
    'Hanoi',
    'Aira Boutique Hanoi Hotel & Spa',
    date '2026-12-27', date '2026-12-30',
    'Balcony AIRA Suite + Pool View Suite, 50 m² hver, kingsize-seng + ekstraseng, morgenmad inkluderet',
    'Elegant boutiquehotel på en stille, trækantet gade i gåafstand fra Old Quarter. Rooftop infinity-pool og bar, spa. Anbefalet af Audley, med i Michelin-guiden.',
    'https://airaboutiquehanoi.com/',
    null, null,
    11300,
    'Ca.-pris.',
    'Gratis afbestilling indtil 5 dage før. 50 % depositum.',
    'valgt'
  ),
  (
    'Ninh Van Bay (Six Senses)',
    'Six Senses Ninh Van Bay',
    date '2026-12-30', date '2027-01-06',
    '1 Hill Top Pool Villa (158 m², udsigt over bugten) + 1 Beachfront Pool Villa (176 m², på stranden), 2 voksne + 1 barn i hver',
    'Villaresort i en afsondret bugt på Hon Heo-halvøen, kun tilgængelig med båd. Privat pool i hver villa, spa, børneklub op til 11 år, gratis kajak, snorkling og SUP.',
    'https://www.sixsenses.com/en/hotels-resorts/asia-the-pacific/vietnam/ninh-van-bay/',
    null, 'Nyhavn Rejser',
    167212,
    'USD 26.059. Inkl. morgenmad, skat, service charge og delt transfer fra Cam Ranh-lufthavnen (1 time i bil + 20 min. speedbåd).',
    'Gratis afbestilling indtil 15. november. Fuld betaling 16. november, derefter ikke-refunderbar.',
    'valgt'
  ),
  (
    'Ke Ga (Azerai)',
    'Azerai Ke Ga Bay',
    date '2027-01-06', date '2027-01-11',
    '2 Pool Villas (130 m², privat pool, 2 voksne + 1 barn i hver), morgenmad inkluderet',
    'Stille, elegant resort i en 4,5 hektar stor have ved en 5 km lang hvid sandstrand med udsigt til Ke Ga-fyret. Tre poolområder, spa og yoga. Michelin Key 2025.',
    'https://azerai.com/azerai-ke-ga-bay/',
    null, null,
    26800,
    'Ca.-pris.',
    'Gratis afbestilling (præcis frist skal tjekkes).',
    'valgt'
  )
) as v (
  destination, name, check_in, check_out, room_setup, description,
  website_url, extra_url, extra_url_label, price_dkk, price_note, cancellation_note, status
)
join public.destinations d on d.name = v.destination
where not exists (select 1 from public.stays s where s.name = v.name);

-- ── Transport ─────────────────────────────────────────────────────────────
-- Cam Ranh → Six Senses er inkluderet i hotelprisen: en kendt ekstrapris på 0 kr., ikke en ukendt pris.
insert into public.transport (
  date, kind, from_place, to_place, departs_at, arrives_at, carrier_and_number, description, price_dkk, status
)
select v.date, v.kind, v.from_place, v.to_place, v.departs_at, v.arrives_at,
       v.carrier_and_number, v.description, v.price_dkk, v.status
from (values
  (date '2026-12-26', 'fly', 'København',  'HCMC',          time '10:50', time '04:30', 'Vietnam Airlines',      'Ankomst næste dag kl. 04:30.',        null::numeric, 'booket'),
  (date '2026-12-27', 'fly', 'HCMC',       'Hanoi',         time '13:40', time '15:50', 'Vietjet VJ138',         'Deluxe med 20 kg bagage pr. person.', 2357,          'valgt'),
  (date '2026-12-30', 'fly', 'Hanoi',      'Cam Ranh',      time '10:30', time '12:20', 'Vietjet VJ785',         'Deluxe med 20 kg bagage pr. person.', 2993,          'valgt'),
  (date '2026-12-30', 'båd', 'Cam Ranh',   'Six Senses',    null,         null,         'Delt bil + speedbåd',   'Inkluderet i Six Senses-prisen.',     0,             'valgt'),
  (date '2027-01-06', 'bil', 'Six Senses', 'Ke Ga',         null,         null,         'Båd + privat chauffør', 'Ca. 4–5 timer.',                      null,          'idé'),
  (date '2027-01-11', 'bil', 'Ke Ga',      'HCMC lufthavn', null,         null,         'Privat chauffør',       '2,5–3 timer.',                        null,          'idé'),
  (date '2027-01-11', 'fly', 'HCMC',       'København',     time '22:45', time '06:00', 'Vietnam Airlines',      'Ankomst næste dag kl. 06:00.',        null,          'booket')
) as v (date, kind, from_place, to_place, departs_at, arrives_at, carrier_and_number, description, price_dkk, status)
where not exists (
  select 1 from public.transport t
  where t.date = v.date and t.kind = v.kind and t.from_place = v.from_place and t.to_place = v.to_place
);

-- ── Aktiviteter ───────────────────────────────────────────────────────────
insert into public.activities (destination_id, title, description, date, time_of_day, price_dkk)
select d.id, v.title, v.description, v.date, v.time_of_day, v.price_dkk
from (values
  (
    'Ninh Van Bay (Six Senses)',
    'Nytårsgalamiddag (obligatorisk)',
    'Obligatorisk nytårsgalamiddag på Six Senses. USD 340 pr. voksen og USD 170 pr. barn under 12. Drikkevarer ikke inkluderet.',
    date '2026-12-31',
    'aften',
    10908::numeric
  )
) as v (destination, title, description, date, time_of_day, price_dkk)
join public.destinations d on d.name = v.destination
where not exists (
  select 1 from public.activities a where a.destination_id = d.id and a.title = v.title
);

-- ── Kontrol: alt fra planen findes nu. Ellers rulles hele transaktionen tilbage. ──
do $$
declare
  mangler text;
begin
  select string_agg(n, ', ') into mangler
  from (values
    ('Saigon (HCMC)'), ('Hanoi'), ('Ninh Van Bay (Six Senses)'), ('Ke Ga (Azerai)')
  ) as v (n)
  where not exists (select 1 from public.destinations d where d.name = v.n);
  if mangler is not null then
    raise exception 'Seed fejlede: destinationer mangler efter kørslen: %', mangler;
  end if;

  select string_agg(n, ', ') into mangler
  from (values
    ('Holiday Inn & Suites Saigon Airport'), ('Aira Boutique Hanoi Hotel & Spa'),
    ('Six Senses Ninh Van Bay'), ('Azerai Ke Ga Bay')
  ) as v (n)
  where not exists (select 1 from public.stays s where s.name = v.n);
  if mangler is not null then
    raise exception 'Seed fejlede: hoteller mangler efter kørslen: %', mangler;
  end if;

  if (select count(*) from public.transport where date between date '2026-12-26' and date '2027-01-11') < 7 then
    raise exception 'Seed fejlede: der er færre end 7 transporter efter kørslen.';
  end if;

  if not exists (select 1 from public.activities where title = 'Nytårsgalamiddag (obligatorisk)') then
    raise exception 'Seed fejlede: nytårsgalamiddagen mangler efter kørslen.';
  end if;

  raise notice 'Seed færdig: alle destinationer, hoteller, transporter og aktiviteter findes.';
end;
$$;

commit;
