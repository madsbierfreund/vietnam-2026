-- Migration: grundskema for Vietnam-rejsen (26.12.2026 – 12.01.2027).
-- Fire tabeller: destinations, stays (hoteller), transport, activities.
-- Alt er delt mellem de to brugere: enhver authenticated bruger må læse,
-- oprette, rette og slette alt. Ingen adgang for anon (ingen politik = afvist).
-- Antal nætter pr. ophold gemmes IKKE — det afledes af check_in/check_out.

-- ── Fælles: updated_at sættes automatisk ved hver opdatering ───────────────
create or replace function public.saet_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── destinations ──────────────────────────────────────────────────────────
create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  area text not null default '',
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── stays (hoteller) ──────────────────────────────────────────────────────
create table public.stays (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations (id) on delete restrict,
  name text not null,
  check_in date not null,
  check_out date not null,
  room_setup text not null default '',
  description text not null default '',
  website_url text,
  extra_url text,
  extra_url_label text,
  price_dkk numeric(12, 2),
  price_note text not null default '',
  cancellation_note text not null default '',
  status text not null default 'idé' check (status in ('idé', 'valgt', 'booket')),
  lat double precision,
  lng double precision,
  google_place_id text,
  google_maps_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stays_datoer_check check (check_out > check_in),
  constraint stays_koordinater_check check ((lat is null) = (lng is null))
);

create index stays_destination_id_idx on public.stays (destination_id);

create trigger stays_updated_at
  before update on public.stays
  for each row execute function public.saet_updated_at();

-- ── transport ─────────────────────────────────────────────────────────────
create table public.transport (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  departs_at time,
  arrives_at time,
  kind text not null check (kind in ('fly', 'bil', 'båd', 'andet')),
  from_place text not null default '',
  to_place text not null default '',
  carrier_and_number text not null default '',
  description text not null default '',
  price_dkk numeric(12, 2),
  status text not null default 'idé' check (status in ('idé', 'valgt', 'booket')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger transport_updated_at
  before update on public.transport
  for each row execute function public.saet_updated_at();

-- ── activities ────────────────────────────────────────────────────────────
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations (id) on delete restrict,
  title text not null,
  description text not null default '',
  url text,
  date date, -- null = endnu ikke lagt på en dag ("Ønsker")
  time_of_day text check (time_of_day in ('morgen', 'formiddag', 'eftermiddag', 'aften')),
  price_dkk numeric(12, 2),
  lat double precision,
  lng double precision,
  google_place_id text,
  google_maps_url text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activities_koordinater_check check ((lat is null) = (lng is null))
);

create index activities_destination_id_idx on public.activities (destination_id);

create trigger activities_updated_at
  before update on public.activities
  for each row execute function public.saet_updated_at();

-- ── RLS: kun authenticated, alt delt ──────────────────────────────────────
alter table public.destinations enable row level security;
alter table public.stays enable row level security;
alter table public.transport enable row level security;
alter table public.activities enable row level security;

create policy "destinations_authenticated_alt" on public.destinations
  for all to authenticated using (true) with check (true);

create policy "stays_authenticated_alt" on public.stays
  for all to authenticated using (true) with check (true);

create policy "transport_authenticated_alt" on public.transport
  for all to authenticated using (true) with check (true);

create policy "activities_authenticated_alt" on public.activities
  for all to authenticated using (true) with check (true);
