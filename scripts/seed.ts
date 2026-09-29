// Seed: indsætter den aktuelle rejseplan. Kør: npm run seed
// Samme data findes som ren SQL i supabase/seed.sql (til Supabase SQL Editor).
// Ret altid begge filer — src/lib/seed.test.ts fejler, hvis de glider fra hinanden.
//
// Idempotent: hver post findes først på sin naturlige nøgle og indsættes KUN hvis
// den mangler. Eksisterende rækker røres aldrig — så placeringer, priser og
// andre rettelser I har lavet i appen overskrives ikke ved en ny kørsel.
//
// Læser NEXT_PUBLIC_SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY fra miljøet
// (npm-scriptet indlæser .env.local, hvis filen findes). Service role-nøglen
// omgår RLS og bruges KUN her — aldrig i appen.
//
// Opholdene seedes UDEN koordinater; placeringen sættes i appen via Places.

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  const mangler = [!url && 'NEXT_PUBLIC_SUPABASE_URL', !serviceKey && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean);
  console.error(`Seed afbrudt: miljøvariablen ${mangler.join(' og ')} mangler (sæt den i .env.local).`);
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

type Raekke = Record<string, unknown>;

// Find på nøglefelter; indsæt hvis ingen findes. Returnerer id.
async function sikr(tabel: string, noegle: Raekke, felter: Raekke, etiket: string): Promise<string> {
  let q = db.from(tabel).select('id');
  for (const [k, v] of Object.entries(noegle)) q = v === null ? q.is(k, null) : q.eq(k, v as string);
  const { data: fundne, error: fejl } = await q;
  if (fejl) throw new Error(`Kunne ikke slå ${etiket} op i ${tabel}: ${fejl.message}`);
  if (fundne && fundne.length > 0) {
    console.log(`  = findes allerede: ${etiket}`);
    return fundne[0].id as string;
  }
  const { data, error } = await db.from(tabel).insert({ ...noegle, ...felter }).select('id').single();
  if (error) throw new Error(`Kunne ikke indsætte ${etiket} i ${tabel}: ${error.message}`);
  console.log(`  + indsat: ${etiket}`);
  return data.id as string;
}

async function main() {
  console.log('Destinationer');
  const dest: Record<string, string> = {};
  const destinationer = [
    { name: 'Saigon (HCMC)', area: 'Ho Chi Minh City, ved lufthavnen', color: '#7E6699', sort_order: 1 },
    { name: 'Hanoi', area: 'Hoan Kiem, ved Old Quarter', color: '#B5735A', sort_order: 2 },
    { name: 'Ninh Van Bay (Six Senses)', area: 'Ninh Van Bay, nord for Nha Trang', color: '#4F8C8B', sort_order: 3 },
    { name: 'Ke Ga (Azerai)', area: 'Ke Ga Bay, syd for Phan Thiet', color: '#B9788F', sort_order: 4 },
  ];
  for (const d of destinationer) {
    const { name, ...rest } = d;
    dest[name] = await sikr('destinations', { name }, rest, name);
  }

  console.log('Hoteller');
  const hoteller = [
    {
      destination: 'Saigon (HCMC)',
      name: 'Holiday Inn & Suites Saigon Airport',
      check_in: '2026-12-26',
      check_out: '2026-12-27',
      room_setup: '2 × 1 Bedroom Suite City View med sovesofa (56 m², maks. 3 personer pr. suite)',
      description:
        '5–10 minutter fra lufthavnen, så vi kan sove efter landingen kl. 04:30.',
      website_url: 'https://www.ihg.com/holidayinn/hotels/us/en/ho-chi-minh-city/sgnsa/hoteldetail',
      extra_url: null,
      extra_url_label: null,
      price_dkk: 2016,
      price_note: '',
      cancellation_note: 'Gratis afbestilling indtil 25. december.',
      status: 'valgt',
    },
    {
      destination: 'Hanoi',
      name: 'Aira Boutique Hanoi Hotel & Spa',
      check_in: '2026-12-27',
      check_out: '2026-12-30',
      room_setup: 'Balcony AIRA Suite + Pool View Suite, 50 m² hver, kingsize-seng + ekstraseng, morgenmad inkluderet',
      description:
        'Elegant boutiquehotel på en stille, trækantet gade i gåafstand fra Old Quarter. Rooftop infinity-pool og bar, spa. Anbefalet af Audley, med i Michelin-guiden.',
      website_url: 'https://airaboutiquehanoi.com/',
      extra_url: null,
      extra_url_label: null,
      price_dkk: 11300,
      price_note: 'Ca.-pris.',
      cancellation_note: 'Gratis afbestilling indtil 5 dage før. 50 % depositum.',
      status: 'valgt',
    },
    {
      destination: 'Ninh Van Bay (Six Senses)',
      name: 'Six Senses Ninh Van Bay',
      check_in: '2026-12-30',
      check_out: '2027-01-06',
      room_setup:
        '1 Hill Top Pool Villa (158 m², udsigt over bugten) + 1 Beachfront Pool Villa (176 m², på stranden), 2 voksne + 1 barn i hver',
      description:
        'Villaresort i en afsondret bugt på Hon Heo-halvøen, kun tilgængelig med båd. Privat pool i hver villa, spa, børneklub op til 11 år, gratis kajak, snorkling og SUP.',
      website_url: 'https://www.sixsenses.com/en/hotels-resorts/asia-the-pacific/vietnam/ninh-van-bay/',
      extra_url: null,
      extra_url_label: 'Nyhavn Rejser',
      price_dkk: 167212,
      price_note:
        'USD 26.059. Inkl. morgenmad, skat, service charge og delt transfer fra Cam Ranh-lufthavnen (1 time i bil + 20 min. speedbåd).',
      cancellation_note: 'Gratis afbestilling indtil 15. november. Fuld betaling 16. november, derefter ikke-refunderbar.',
      status: 'valgt',
    },
    {
      destination: 'Ke Ga (Azerai)',
      name: 'Azerai Ke Ga Bay',
      check_in: '2027-01-06',
      check_out: '2027-01-11',
      room_setup: '2 Pool Villas (130 m², privat pool, 2 voksne + 1 barn i hver), morgenmad inkluderet',
      description:
        'Stille, elegant resort i en 4,5 hektar stor have ved en 5 km lang hvid sandstrand med udsigt til Ke Ga-fyret. Tre poolområder, spa og yoga. Michelin Key 2025.',
      website_url: 'https://azerai.com/azerai-ke-ga-bay/',
      extra_url: null,
      extra_url_label: null,
      price_dkk: 26800,
      price_note: 'Ca.-pris.',
      cancellation_note: 'Gratis afbestilling (præcis frist skal tjekkes).',
      status: 'valgt',
    },
  ];
  for (const h of hoteller) {
    const { destination, name, ...rest } = h;
    await sikr('stays', { name }, { destination_id: dest[destination], ...rest }, name);
  }

  console.log('Transport');
  const transport = [
    {
      date: '2026-12-26', kind: 'fly', from_place: 'København', to_place: 'HCMC',
      departs_at: '10:50', arrives_at: '04:30', carrier_and_number: 'Vietnam Airlines',
      description: 'Ankomst næste dag kl. 04:30.', price_dkk: null, status: 'booket',
    },
    {
      date: '2026-12-27', kind: 'fly', from_place: 'HCMC', to_place: 'Hanoi',
      departs_at: '13:40', arrives_at: '15:50', carrier_and_number: 'Vietjet VJ138',
      description: 'Deluxe med 20 kg bagage pr. person.', price_dkk: 2357, status: 'valgt',
    },
    {
      date: '2026-12-30', kind: 'fly', from_place: 'Hanoi', to_place: 'Cam Ranh',
      departs_at: '10:30', arrives_at: '12:20', carrier_and_number: 'Vietjet VJ785',
      description: 'Deluxe med 20 kg bagage pr. person.', price_dkk: 2993, status: 'valgt',
    },
    {
      // Inkluderet i Six Senses-prisen: en kendt ekstrapris på 0 kr., ikke en ukendt pris.
      date: '2026-12-30', kind: 'båd', from_place: 'Cam Ranh', to_place: 'Six Senses',
      departs_at: null, arrives_at: null, carrier_and_number: 'Delt bil + speedbåd',
      description: 'Inkluderet i Six Senses-prisen.', price_dkk: 0, status: 'valgt',
    },
    {
      date: '2027-01-06', kind: 'bil', from_place: 'Six Senses', to_place: 'Ke Ga',
      departs_at: null, arrives_at: null, carrier_and_number: 'Båd + privat chauffør',
      description: 'Ca. 4–5 timer.', price_dkk: null, status: 'idé',
    },
    {
      date: '2027-01-11', kind: 'bil', from_place: 'Ke Ga', to_place: 'HCMC lufthavn',
      departs_at: null, arrives_at: null, carrier_and_number: 'Privat chauffør',
      description: '2,5–3 timer.', price_dkk: null, status: 'idé',
    },
    {
      date: '2027-01-11', kind: 'fly', from_place: 'HCMC', to_place: 'København',
      departs_at: '22:45', arrives_at: '06:00', carrier_and_number: 'Vietnam Airlines',
      description: 'Ankomst næste dag kl. 06:00.', price_dkk: null, status: 'booket',
    },
  ];
  for (const t of transport) {
    const { date, kind, from_place, to_place, ...rest } = t;
    await sikr('transport', { date, kind, from_place, to_place }, rest, `${date} ${kind} ${from_place} → ${to_place}`);
  }

  console.log('Aktiviteter');
  await sikr(
    'activities',
    { destination_id: dest['Ninh Van Bay (Six Senses)'], title: 'Nytårsgalamiddag (obligatorisk)' },
    {
      description:
        'Obligatorisk nytårsgalamiddag på Six Senses. USD 340 pr. voksen og USD 170 pr. barn under 12. Drikkevarer ikke inkluderet.',
      date: '2026-12-31',
      time_of_day: 'aften',
      price_dkk: 10908,
    },
    'Nytårsgalamiddag (obligatorisk)',
  );

  console.log('\nSeed færdig.');
}

main().catch((e) => {
  console.error(`\nSeed fejlede: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
