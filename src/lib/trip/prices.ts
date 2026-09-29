// Samlet pris. En manglende pris (null) er UKENDT, aldrig 0: den tælles som
// "uden pris" og indgår ikke i summen. En pris på 0 (fx "inkluderet") er kendt.

export type PriceTotal = { total: number; medPris: number; udenPris: number };

export function priceTotal(poster: { price_dkk: number | string | null }[]): PriceTotal {
  let total = 0;
  let medPris = 0;
  let udenPris = 0;
  for (const p of poster) {
    if (p.price_dkk === null || p.price_dkk === undefined || p.price_dkk === '') {
      udenPris += 1;
      continue;
    }
    total += Number(p.price_dkk);
    medPris += 1;
  }
  return { total, medPris, udenPris };
}

const KR = new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 });

export function formatDkk(beloeb: number | string | null): string {
  if (beloeb === null || beloeb === '') return 'Pris ukendt';
  return `${KR.format(Number(beloeb))} kr.`;
}

// Beløb fra et formularfelt. Tomt felt = ukendt pris (null), aldrig 0.
// Forstår dansk skrivemåde: "11.300", "11 300", "2016,50".
export function parseBelob(raa: string): number | null {
  let v = raa.replace(/\s/g, '').replace(/kr\.?$/i, '');
  if (v === '') return null;
  if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, '');
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error(`"${raa}" er ikke et gyldigt beløb.`);
  return n;
}
