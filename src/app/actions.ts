'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hentAdgang } from '@/lib/adgang';
import { redigeringsFejl } from '@/lib/rolle';
import { aktivitetsPeriode, foersteRejsedag } from '@/lib/trip/activities';
import {
  STATUSER,
  TIDER_PAA_DAGEN,
  TRANSPORT_KINDS,
  type PickedPlace,
  type Status,
  type TimeOfDay,
  type TransportKind,
} from '@/lib/types';

// Alle skrivninger. Hver handling returnerer en fejltekst MED Supabase' egen
// årsag, eller omdirigerer ved succes. Fejl sluges aldrig.
// Priser (price_dkk, price_note) vises og redigeres ikke i appen. De sendes derfor
// aldrig med i insert/update, så de eksisterende værdier i databasen bevares.

export type Svar = string | null;

// ── Læsning af formularfelter ─────────────────────────────────────────────
function tekst(fd: FormData, navn: string): string {
  return String(fd.get(navn) ?? '').trim();
}

function tekstEllerNull(fd: FormData, navn: string): string | null {
  const v = tekst(fd, navn);
  return v === '' ? null : v;
}

function tid(fd: FormData, navn: string): string | null {
  const v = tekst(fd, navn);
  return v === '' ? null : v;
}

function valg<T extends string>(fd: FormData, navn: string, tilladte: readonly T[]): T {
  const v = tekst(fd, navn) as T;
  if (!tilladte.includes(v)) throw new Error(`Ugyldig værdi for ${navn}: "${v}".`);
  return v;
}

// Placering kommer KUN fra et Places-valg (skjulte felter), aldrig manuelt.
function placering(fd: FormData) {
  const lat = tekst(fd, 'lat');
  const lng = tekst(fd, 'lng');
  if (lat === '' || lng === '') {
    return { lat: null, lng: null, google_place_id: null, google_maps_url: null };
  }
  return {
    lat: Number(lat),
    lng: Number(lng),
    google_place_id: tekstEllerNull(fd, 'google_place_id'),
    google_maps_url: tekstEllerNull(fd, 'google_maps_url'),
  };
}

// Rollen tjekkes i hver handling. Læsere afvises her med en klar fejl; RLS i
// databasen (kan_redigere()) er den endelige håndhævelse.
async function kraevRedigering(handling: string): Promise<Svar> {
  const adgang = await hentAdgang();
  const fejl = redigeringsFejl(adgang.rolle, handling);
  if (!fejl) return null;
  return adgang.fejl ? `${fejl} ${adgang.fejl}` : fejl;
}

// RLS afviser update/delete uden fejl: der ændres bare 0 rækker. Det skal ikke ligne succes.
const INGEN_RAEKKER =
  'ingen rækker blev ændret — enten findes posten ikke længere, eller databasen afviste ændringen (kun admin og redaktør må redigere).';

function som(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// ── Hoteller ──────────────────────────────────────────────────────────────
export async function gemHotel(_f: Svar, fd: FormData): Promise<Svar> {
  const afvist = await kraevRedigering('gemme hotellet');
  if (afvist) return afvist;
  const id = tekstEllerNull(fd, 'id');
  let raekke;
  try {
    raekke = {
      destination_id: tekst(fd, 'destination_id'),
      name: tekst(fd, 'name'),
      check_in: tekst(fd, 'check_in'),
      check_out: tekst(fd, 'check_out'),
      room_setup: tekst(fd, 'room_setup'),
      description: tekst(fd, 'description'),
      website_url: tekstEllerNull(fd, 'website_url'),
      extra_url: tekstEllerNull(fd, 'extra_url'),
      extra_url_label: tekstEllerNull(fd, 'extra_url_label'),
      cancellation_note: tekst(fd, 'cancellation_note'),
      status: valg<Status>(fd, 'status', STATUSER),
      ...placering(fd),
    };
  } catch (e) {
    return `Kunne ikke gemme hotellet: ${som(e)}`;
  }
  if (!raekke.name) return 'Kunne ikke gemme hotellet: navn mangler.';
  if (!raekke.destination_id) return 'Kunne ikke gemme hotellet: vælg en destination.';
  if (!raekke.check_in || !raekke.check_out) return 'Kunne ikke gemme hotellet: check-in og check-ud skal udfyldes.';
  if (raekke.check_out <= raekke.check_in) return 'Kunne ikke gemme hotellet: check-ud skal ligge efter check-in.';

  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from('stays').update(raekke).eq('id', id).select('id').maybeSingle()
    : await supabase.from('stays').insert(raekke).select('id').single();
  if (error) return `Kunne ikke gemme hotellet: ${error.message}`;
  if (!data) return `Kunne ikke gemme hotellet: ${INGEN_RAEKKER}`;

  revalidatePath('/', 'layout');
  redirect(`/hotel/${data.id}`);
}

export async function sletHotel(id: string): Promise<Svar> {
  const afvist = await kraevRedigering('slette hotellet');
  if (afvist) return afvist;
  const supabase = await createClient();
  const { data, error } = await supabase.from('stays').delete().eq('id', id).select('id');
  if (error) return `Kunne ikke slette hotellet: ${error.message}`;
  if (!data || data.length === 0) return `Kunne ikke slette hotellet: ${INGEN_RAEKKER}`;
  revalidatePath('/', 'layout');
  redirect('/');
}

// ── Aktiviteter ───────────────────────────────────────────────────────────
export async function gemAktivitet(_f: Svar, fd: FormData): Promise<Svar> {
  const afvist = await kraevRedigering('gemme aktiviteten');
  if (afvist) return afvist;
  const id = tekstEllerNull(fd, 'id');
  let raekke;
  try {
    const tidPaaDagen = tekst(fd, 'time_of_day');
    raekke = {
      destination_id: tekst(fd, 'destination_id'),
      title: tekst(fd, 'title'),
      description: tekst(fd, 'description'),
      url: tekstEllerNull(fd, 'url'),
      date: tekstEllerNull(fd, 'date'),
      time_of_day: tidPaaDagen === '' ? null : valg<TimeOfDay>(fd, 'time_of_day', TIDER_PAA_DAGEN),
      ...placering(fd),
    };
  } catch (e) {
    return `Kunne ikke gemme aktiviteten: ${som(e)}`;
  }
  if (!raekke.title) return 'Kunne ikke gemme aktiviteten: titel mangler.';
  if (!raekke.destination_id) return 'Kunne ikke gemme aktiviteten: vælg en destination.';

  const supabase = await createClient();

  // Datoen skal ligge i destinationens opholdsperiode og efter rejsens første dag (flyet ud).
  if (raekke.date) {
    const [{ data: stays, error }, { data: transport, error: tFejl }] = await Promise.all([
      supabase.from('stays').select('destination_id, check_in, check_out').eq('destination_id', raekke.destination_id),
      supabase.from('transport').select('date'),
    ]);
    if (error) return `Kunne ikke kontrollere datoen: ${error.message}`;
    if (tFejl) return `Kunne ikke kontrollere datoen: ${tFejl.message}`;
    const periode = aktivitetsPeriode(raekke.destination_id, stays ?? [], foersteRejsedag(transport ?? []));
    if (!periode) return 'Kunne ikke gemme aktiviteten: destinationen har ingen dage, hvor der kan vælges dato.';
    if (raekke.date < periode.min || raekke.date > periode.max) {
      return `Kunne ikke gemme aktiviteten: datoen skal ligge mellem ${periode.min} og ${periode.max}.`;
    }
  }

  const { data, error } = id
    ? await supabase.from('activities').update(raekke).eq('id', id).select('id').maybeSingle()
    : await supabase.from('activities').insert(raekke).select('id').single();
  if (error) return `Kunne ikke gemme aktiviteten: ${error.message}`;
  if (!data) return `Kunne ikke gemme aktiviteten: ${INGEN_RAEKKER}`;

  revalidatePath('/', 'layout');
  redirect(`/aktivitet/${data.id}`);
}

export async function sletAktivitet(id: string): Promise<Svar> {
  const afvist = await kraevRedigering('slette aktiviteten');
  if (afvist) return afvist;
  const supabase = await createClient();
  const { data, error } = await supabase.from('activities').delete().eq('id', id).select('id');
  if (error) return `Kunne ikke slette aktiviteten: ${error.message}`;
  if (!data || data.length === 0) return `Kunne ikke slette aktiviteten: ${INGEN_RAEKKER}`;
  revalidatePath('/', 'layout');
  redirect('/');
}

// ── Transport ─────────────────────────────────────────────────────────────
export async function gemTransport(_f: Svar, fd: FormData): Promise<Svar> {
  const afvist = await kraevRedigering('gemme transporten');
  if (afvist) return afvist;
  const id = tekstEllerNull(fd, 'id');
  let raekke;
  try {
    raekke = {
      date: tekst(fd, 'date'),
      departs_at: tid(fd, 'departs_at'),
      arrives_at: tid(fd, 'arrives_at'),
      kind: valg<TransportKind>(fd, 'kind', TRANSPORT_KINDS),
      from_place: tekst(fd, 'from_place'),
      to_place: tekst(fd, 'to_place'),
      carrier_and_number: tekst(fd, 'carrier_and_number'),
      description: tekst(fd, 'description'),
      status: valg<Status>(fd, 'status', STATUSER),
    };
  } catch (e) {
    return `Kunne ikke gemme transporten: ${som(e)}`;
  }
  if (!raekke.date) return 'Kunne ikke gemme transporten: dato mangler.';

  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from('transport').update(raekke).eq('id', id).select('id')
    : await supabase.from('transport').insert(raekke).select('id');
  if (error) return `Kunne ikke gemme transporten: ${error.message}`;
  if (!data || data.length === 0) return `Kunne ikke gemme transporten: ${INGEN_RAEKKER}`;

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function sletTransport(id: string): Promise<Svar> {
  const afvist = await kraevRedigering('slette transporten');
  if (afvist) return afvist;
  const supabase = await createClient();
  const { data, error } = await supabase.from('transport').delete().eq('id', id).select('id');
  if (error) return `Kunne ikke slette transporten: ${error.message}`;
  if (!data || data.length === 0) return `Kunne ikke slette transporten: ${INGEN_RAEKKER}`;
  revalidatePath('/', 'layout');
  redirect('/');
}

// ── Placering sat fra listen "Mangler placering" ──────────────────────────
export async function saetPlacering(
  tabel: 'stays' | 'activities',
  id: string,
  sted: PickedPlace,
): Promise<Svar> {
  const afvist = await kraevRedigering('gemme placeringen');
  if (afvist) return afvist;
  if (tabel !== 'stays' && tabel !== 'activities') return `Ukendt tabel: ${tabel}`;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(tabel)
    .update({
      lat: sted.lat,
      lng: sted.lng,
      google_place_id: sted.google_place_id,
      google_maps_url: sted.google_maps_url,
    })
    .eq('id', id)
    .select('id');
  if (error) return `Kunne ikke gemme placeringen: ${error.message}`;
  if (!data || data.length === 0) return `Kunne ikke gemme placeringen: ${INGEN_RAEKKER}`;
  revalidatePath('/', 'layout');
  return null;
}
