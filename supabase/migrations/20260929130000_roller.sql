-- Migration: roller (redaktør / læser).
--   redaktør — må oprette, rette og slette alt.
--   læser    — må se alt, men intet oprette, rette eller slette.
-- En bruger uden række i profiles behandles som læser (fail closed): kan_redigere()
-- giver false, når rækken mangler.
-- Roller ændres KUN i Supabase → Table Editor → profiles. Ingen kan ændre profiles via API'et.
--
-- Kør i Supabase → SQL Editor EFTER 20260929120000_init.sql. Kør den én gang.

-- ── profiles ──────────────────────────────────────────────────────────────
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'læser' check (role in ('redaktør', 'læser')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Man kan kun læse sin egen række. Ingen insert/update/delete-politikker: via API'et
-- kan ingen oprette, ændre eller slette profiler (heller ikke sin egen rolle).
create policy "profiles_laes_egen" on public.profiles
  for select to authenticated
  using (user_id = auth.uid());

revoke insert, update, delete on public.profiles from anon, authenticated;

-- ── Ny bruger → profil som læser ──────────────────────────────────────────
-- Enhver bruger oprettet i Authentication → Users får automatisk en profil med rollen læser.
create function public.opret_profil_for_ny_bruger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email, role)
  values (new.id, coalesce(new.email, ''), 'læser')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.opret_profil_for_ny_bruger() from public, anon, authenticated;

create trigger opret_profil_efter_ny_bruger
  after insert on auth.users
  for each row execute function public.opret_profil_for_ny_bruger();

-- ── kan_redigere() ────────────────────────────────────────────────────────
-- security definer, så den kan læse profiles uanset kalderens RLS; search_path er
-- låst til tom, og alle navne er fuldt kvalificerede.
create function public.kan_redigere()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'redaktør'
  );
$$;

revoke execute on function public.kan_redigere() from public, anon;
grant execute on function public.kan_redigere() to authenticated;

-- ── Ny RLS på rejsens tabeller: alle må læse, kun redaktør må skrive ──────
drop policy "destinations_authenticated_alt" on public.destinations;
drop policy "stays_authenticated_alt" on public.stays;
drop policy "transport_authenticated_alt" on public.transport;
drop policy "activities_authenticated_alt" on public.activities;

create policy "destinations_laes" on public.destinations for select to authenticated using (true);
create policy "destinations_opret" on public.destinations for insert to authenticated with check (public.kan_redigere());
create policy "destinations_ret" on public.destinations for update to authenticated using (public.kan_redigere()) with check (public.kan_redigere());
create policy "destinations_slet" on public.destinations for delete to authenticated using (public.kan_redigere());

create policy "stays_laes" on public.stays for select to authenticated using (true);
create policy "stays_opret" on public.stays for insert to authenticated with check (public.kan_redigere());
create policy "stays_ret" on public.stays for update to authenticated using (public.kan_redigere()) with check (public.kan_redigere());
create policy "stays_slet" on public.stays for delete to authenticated using (public.kan_redigere());

create policy "transport_laes" on public.transport for select to authenticated using (true);
create policy "transport_opret" on public.transport for insert to authenticated with check (public.kan_redigere());
create policy "transport_ret" on public.transport for update to authenticated using (public.kan_redigere()) with check (public.kan_redigere());
create policy "transport_slet" on public.transport for delete to authenticated using (public.kan_redigere());

create policy "activities_laes" on public.activities for select to authenticated using (true);
create policy "activities_opret" on public.activities for insert to authenticated with check (public.kan_redigere());
create policy "activities_ret" on public.activities for update to authenticated using (public.kan_redigere()) with check (public.kan_redigere());
create policy "activities_slet" on public.activities for delete to authenticated using (public.kan_redigere());

-- ── Profiler for eksisterende brugere ─────────────────────────────────────
insert into public.profiles (user_id, email, role)
select
  u.id,
  coalesce(u.email, ''),
  case
    when lower(u.email) in ('madsbierfreund@gmail.com', 'marie.vedsted@gmail.com') then 'redaktør'
    else 'læser'
  end
from auth.users u
on conflict (user_id) do nothing;

do $$
begin
  if not exists (select 1 from auth.users where lower(email) = 'madsbierfreund@gmail.com') then
    raise notice 'Brugeren madsbierfreund@gmail.com findes ikke i auth.users — ingen redaktør-profil oprettet.';
  end if;
  if not exists (select 1 from auth.users where lower(email) = 'marie.vedsted@gmail.com') then
    raise notice 'Brugeren marie.vedsted@gmail.com findes ikke i auth.users — ingen redaktør-profil oprettet.';
  end if;
end;
$$;
