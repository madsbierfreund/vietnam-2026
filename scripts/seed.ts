// Seed: indsætter den aktuelle rejseplan (den endelige plan fra 3. okt. 2026). Kør: npm run seed
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

const DES_ARTS_DESC = [
  'Boutiquehotel i fransk kolonistil med kunst fra Indokina, rooftop-pool og rooftop-bar (Social Club).',
  'Status: Marie har sendt forespørgsel. Hotellets reservationsafdeling svarer efter 5. okt. 2026.',
  'Vi lander i SGN 27. dec. kl. 04:30 – tidlig check-in skal aftales med hotellet.',
  'Adresse: 76-78 Nguyen Thi Minh Khai, District 3, Ho Chi Minh City, Vietnam',
  'Telefon: +84 28 3989 8888',
  'E-mail: h9231@accor.com (hotellet), Hdas.DU@accor.com (front office)',
].join('\n');

const REGENT_DESC = [
  'Bekræftelsesnummer: 6092079',
  'Rate: Best Flexible Member Exclusive Rate. Daglig morgenmad i Rice Market og Refreshment Gallery inkluderet.',
  'Betaling: fuld betaling senest 2. dec. 2026 (hotellet sender et betalingslink 28 dage før ankomst). Bookingen er garanteret med kreditkort.',
  'Check-in kl. 15:00. Medbring det fysiske kreditkort, der er brugt som garanti.',
  'Lufthavnstransfer: Mercedes-Benz Viano til 6 med bagage. Ikke bekræftet endnu – hotellet skal have vores flynumre.',
  'Nytårsprogram: ikke offentliggjort af hotellet endnu.',
  'Adresse: Phu Quoc Marina Integrated Resort Complex, Duong Bao Ward, Phu Quoc Special Zone, An Giang, Vietnam',
  'Telefon: resort +84 297 388 0000, reservationer +84 28 7301 1800',
  'E-mail: reservations.regentpq@ihg.com',
].join('\n');

const AZERAI_DESC = [
  'Stille, elegant resort i en 4,5 hektar stor have ved en 5 km lang hvid sandstrand med udsigt til Ke Ga-fyret. Tre poolområder, spa og yoga. Michelin Key 2025.',
  '',
  'Reservationsnummer: 2106044',
  'Rate: Flexible – Super Early Bird. Daglig morgenmad inkluderet.',
  'Sen check-ud til kl. 18:00 den 11. jan. (inkluderet i prisen).',
  'Private transfers inkluderet: SGN-lufthavnen → resortet 5. jan. og resortet → SGN-lufthavnen 11. jan. (resortet anbefaler afgang ca. kl. 16:00).',
  'Betaling: 50 % depositum senest 5. okt. 2026 via OnePay. Resten senest 29. dec. 2026 (resortet sender et link).',
  'Check-in kl. 14:00.',
  'Adresse: Hon Lan Area, Tan Thanh Commune, Lam Dong Province, Vietnam',
  'Telefon: +84 252 3682 222, hotline +84 889 02 07 07',
  'E-mail: reservations.kegabay@azerai.com',
].join('\n');

async function main() {
  console.log('Destinationer');
  const dest: Record<string, string> = {};
  const destinationer = [
    { name: 'Saigon (HCMC)', area: 'Ho Chi Minh City', color: '#7E6699', sort_order: 1 },
    { name: 'Phu Quoc (Regent)', area: 'Duong Bao, Phu Quoc', color: '#4F8C8B', sort_order: 2 },
    { name: 'Ke Ga (Azerai)', area: 'Ke Ga Bay, syd for Phan Thiet', color: '#B9788F', sort_order: 3 },
  ];
  for (const d of destinationer) {
    const { name, ...rest } = d;
    dest[name] = await sikr('destinations', { name }, rest, name);
  }

  console.log('Hoteller');
  const hoteller = [
    {
      destination: 'Saigon (HCMC)',
      name: 'Hôtel des Arts Saigon – MGallery',
      check_in: '2026-12-27',
      check_out: '2026-12-30',
      room_setup: 'Forespurgt: værelser til 2 voksne og 4 børn (16, 14, 9 og 8 år), helst tæt på hinanden',
      description: DES_ARTS_DESC,
      website_url: 'https://all.accor.com/hotel/9231/index.en.shtml',
      price_dkk: null,
      price_note: 'Skøn ca. 14.200 kr. for 2 Deluxe-værelser i 3 nætter (ikke bekræftet)',
      cancellation_note: '',
      status: 'valgt',
    },
    {
      destination: 'Phu Quoc (Regent)',
      name: 'Regent Phu Quoc',
      check_in: '2026-12-30',
      check_out: '2027-01-05',
      room_setup: '2 forbundne Ocean View Suites (én king, én twin)',
      description: REGENT_DESC,
      website_url: 'https://phuquoc.regenthotels.com',
      price_dkk: null,
      price_note: 'I alt VND 459.621.300 (ca. USD 17.344). Lufthavnstransfer: VND 1.360.800 pr. bil pr. vej.',
      cancellation_note:
        'Gratis afbestilling indtil kl. 18:00 vietnamesisk tid den 2. dec. 2026. Derefter mistes hele depositummet.',
      status: 'booket',
    },
    {
      destination: 'Ke Ga (Azerai)',
      name: 'Azerai Ke Ga Bay',
      check_in: '2027-01-05',
      check_out: '2027-01-11',
      room_setup:
        '2 Pool Villas med plungepool (130 m²). Ønsket sengeopsætning (afventer resortets bekræftelse): Villa 1 – kingsize-seng til Marie og de to yngste. Villa 2 – to separate senge til den 16- og 14-årige plus ekstraseng til Mads.',
      description: AZERAI_DESC,
      website_url: 'https://azerai.com',
      price_dkk: 35950,
      price_note:
        'I alt VND 145.580.627 (ca. 35.950 kr.). Depositum VND 72.790.313 senest 5. okt. 2026 via OnePay. Rest VND 72.790.314 den 29. dec. 2026.',
      cancellation_note:
        'Gratis ændring af datoer og værelser indtil 7 dage før ankomst (29. dec. 2026); prisen genberegnes ved nye datoer. Afbestilling inden for 7 dage før ankomst koster 100 %.',
      status: 'booket',
    },
  ];
  for (const h of hoteller) {
    const { destination, name, ...rest } = h;
    await sikr('stays', { name }, { destination_id: dest[destination], ...rest }, name);
  }

  console.log('Transport');
  const transport = [
    {
      date: '2026-12-26', kind: 'fly', from_place: 'København', to_place: 'Ho Chi Minh City (SGN)',
      departs_at: '10:50', arrives_at: '04:30', carrier_and_number: 'Vietnam Airlines',
      description: 'Booking-reference DAKEO5. Lander i SGN 27. dec. kl. 04:30.', status: 'booket',
    },
    {
      date: '2026-12-30', kind: 'fly', from_place: 'Ho Chi Minh City (SGN)', to_place: 'Phu Quoc (PQC)',
      departs_at: null, arrives_at: null, carrier_and_number: '',
      description: 'Indenrigsfly. Ikke booket endnu.', status: 'idé',
    },
    {
      date: '2027-01-05', kind: 'fly', from_place: 'Phu Quoc (PQC)', to_place: 'Ho Chi Minh City (SGN)',
      departs_at: '11:05', arrives_at: '12:10', carrier_and_number: 'Vietjet VJ320',
      description: 'Ikke booket endnu. Foretrukket: Vietjet VJ320 kl. 11:05–12:10.', status: 'idé',
    },
    {
      date: '2027-01-05', kind: 'bil', from_place: 'Ho Chi Minh City (SGN)', to_place: 'Azerai Ke Ga Bay',
      departs_at: null, arrives_at: null, carrier_and_number: 'Privat transfer (Azerai)',
      description: 'Ca. 3 timer. Arrangeres af resortet og er inkluderet i Azerai-bookingen.', status: 'booket',
    },
    {
      date: '2027-01-11', kind: 'bil', from_place: 'Azerai Ke Ga Bay', to_place: 'Ho Chi Minh City (SGN)',
      departs_at: '16:00', arrives_at: null, carrier_and_number: 'Privat transfer (Azerai)',
      description: 'Inkluderet i Azerai-bookingen. Resortet anbefaler afgang ca. kl. 16:00. Sen check-ud til kl. 18:00.',
      status: 'booket',
    },
    {
      date: '2027-01-11', kind: 'fly', from_place: 'Ho Chi Minh City (SGN)', to_place: 'København via München',
      departs_at: '22:45', arrives_at: null, carrier_and_number: 'Vietnam Airlines VN033',
      description:
        'Booking-reference DAKEO5. Vietnam Airlines har nedgraderet os fra premium economy til economy på VN033. Vi har ikke accepteret det og afventer deres svar.',
      status: 'booket',
    },
  ];
  for (const t of transport) {
    const { date, kind, from_place, to_place, ...rest } = t;
    await sikr('transport', { date, kind, from_place, to_place }, rest, `${date} ${kind} ${from_place} → ${to_place}`);
  }

  console.log('\nSeed færdig.');
}

main().catch((e) => {
  console.error(`\nSeed fejlede: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
