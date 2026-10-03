-- Migration: hotellet i Ho Chi Minh City er valgt (kun data, intet skema).
-- Pladsholderen "Hotel i Ho Chi Minh City (ikke valgt endnu)" erstattes af
-- Hôtel des Arts Saigon – MGallery, 27.–30. dec. 2026 (3 nætter), status valgt
-- (forespørgsel sendt, afventer hotellets svar). Intet andet i planen ændres.
--
-- Kør i Supabase → SQL Editor EFTER 20261003120000_ny_plan.sql.
-- Kan køres flere gange: resultatet er det samme. Fejler noget, rulles alt tilbage.

begin;

-- 1. Pladsholderen omdøbes (samme række, samme id), hvis hotellet ikke allerede findes.
update public.stays
set name = 'Hôtel des Arts Saigon – MGallery'
where name = 'Hotel i Ho Chi Minh City (ikke valgt endnu)'
  and not exists (select 1 from public.stays where name = 'Hôtel des Arts Saigon – MGallery');

-- 2. En eventuel tilbageværende pladsholder fjernes.
delete from public.stays where name = 'Hotel i Ho Chi Minh City (ikke valgt endnu)';

-- 3. Findes hotellet stadig ikke (fx hvis pladsholderen var slettet i appen), oprettes det.
insert into public.stays (destination_id, name, check_in, check_out)
select d.id, 'Hôtel des Arts Saigon – MGallery', date '2026-12-27', date '2026-12-30'
from public.destinations d
where d.name = 'Saigon (HCMC)'
  and not exists (select 1 from public.stays where name = 'Hôtel des Arts Saigon – MGallery');

-- 4. Alle felter sættes.
update public.stays s
set destination_id = d.id,
    check_in = date '2026-12-27',
    check_out = date '2026-12-30',
    status = 'valgt',
    room_setup = 'Forespurgt: værelser til 2 voksne og 4 børn (16, 14, 9 og 8 år), helst tæt på hinanden',
    description = 'Boutiquehotel i fransk kolonistil med kunst fra Indokina, rooftop-pool og rooftop-bar (Social Club).
Status: Marie har sendt forespørgsel. Hotellets reservationsafdeling svarer efter 5. okt. 2026.
Vi lander i SGN 27. dec. kl. 04:30 – tidlig check-in skal aftales med hotellet.
Adresse: 76-78 Nguyen Thi Minh Khai, District 3, Ho Chi Minh City, Vietnam
Telefon: +84 28 3989 8888
E-mail: h9231@accor.com (hotellet), Hdas.DU@accor.com (front office)',
    website_url = 'https://all.accor.com/hotel/9231/index.en.shtml',
    extra_url = null,
    extra_url_label = null,
    price_dkk = null,
    price_note = 'Skøn ca. 14.200 kr. for 2 Deluxe-værelser i 3 nætter (ikke bekræftet)',
    cancellation_note = ''
from public.destinations d
where d.name = 'Saigon (HCMC)' and s.name = 'Hôtel des Arts Saigon – MGallery';

-- ── Kontrol: ellers rulles alt tilbage ────────────────────────────────────
do $$
declare
  n_dest int; n_stays int; n_transport int;
begin
  if not exists (
    select 1 from public.stays
    where name = 'Hôtel des Arts Saigon – MGallery'
      and check_in = date '2026-12-27' and check_out = date '2026-12-30'
  ) then
    raise exception 'Fejlede: Hôtel des Arts Saigon – MGallery med 27.–30. dec. 2026 findes ikke (mangler destinationen "Saigon (HCMC)"?).';
  end if;
  if exists (select 1 from public.stays where name = 'Hotel i Ho Chi Minh City (ikke valgt endnu)') then
    raise exception 'Fejlede: pladsholderen "Hotel i Ho Chi Minh City (ikke valgt endnu)" findes stadig.';
  end if;
  select count(*) into n_dest from public.destinations;
  select count(*) into n_stays from public.stays;
  select count(*) into n_transport from public.transport;
  if n_dest <> 3 or n_stays <> 3 or n_transport <> 6 then
    raise exception 'Fejlede: forventede 3 destinationer, 3 hoteller og 6 transporter, fandt %, % og %.',
      n_dest, n_stays, n_transport;
  end if;
  raise notice 'Hôtel des Arts Saigon – MGallery er lagt ind (27.–30. dec.). 3 destinationer, 3 hoteller, 6 transporter.';
end;
$$;

commit;
