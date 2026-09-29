import { describe, expect, it } from 'vitest';
import { TRIP_END, TRIP_START, formatTimeSpan, nights, stayForNight, tripDays } from './dates';
import { assignLanes, blockLayout, makeAxis, positionPct, todayPct } from './timeline';
import { parseBelob, priceTotal } from './prices';
import { nearestDestinationId } from './geo';
import { routeLegs } from './route';
import { destinationPeriod, splitActivities } from './activities';

// Den aktuelle plan (samme datoer som seed-scriptet).
const STAYS = [
  { id: 'hi', destination_id: 'saigon', check_in: '2026-12-26', check_out: '2026-12-27', lat: 10.8166, lng: 106.6679 },
  { id: 'aira', destination_id: 'hanoi', check_in: '2026-12-27', check_out: '2026-12-30', lat: 21.0245, lng: 105.8412 },
  { id: 'six', destination_id: 'ninhvan', check_in: '2026-12-30', check_out: '2027-01-06', lat: 12.3569, lng: 109.2769 },
  { id: 'azerai', destination_id: 'kega', check_in: '2027-01-06', check_out: '2027-01-11', lat: 10.6951, lng: 107.9897 },
];

describe('nætter pr. ophold', () => {
  it('afledes af check_in/check_out, også hen over nytår', () => {
    expect(STAYS.map(nights)).toEqual([1, 3, 7, 5]);
  });
});

describe('hvilket ophold gælder en nat', () => {
  it('check-in-natten hører til opholdet, check-ud-natten til det næste', () => {
    expect(stayForNight(STAYS, '2026-12-26')?.id).toBe('hi');
    expect(stayForNight(STAYS, '2026-12-27')?.id).toBe('aira');
    expect(stayForNight(STAYS, '2026-12-29')?.id).toBe('aira');
    expect(stayForNight(STAYS, '2026-12-31')?.id).toBe('six');
    expect(stayForNight(STAYS, '2027-01-05')?.id).toBe('six');
    expect(stayForNight(STAYS, '2027-01-06')?.id).toBe('azerai');
  });
  it('natten i flyet hjem har intet ophold', () => {
    expect(stayForNight(STAYS, '2027-01-11')).toBeNull();
    expect(stayForNight(STAYS, '2026-12-25')).toBeNull();
  });
});

describe('dagslisten 26. dec. – 12. jan.', () => {
  it('har 18 dage, starter og slutter rigtigt og krydser årsskiftet', () => {
    const dage = tripDays();
    expect(dage).toHaveLength(18);
    expect(dage[0]).toBe(TRIP_START);
    expect(dage.at(-1)).toBe(TRIP_END);
    expect(dage).toContain('2026-12-31');
    expect(dage).toContain('2027-01-01');
    expect(new Set(dage).size).toBe(18);
  });
});

describe('tidslinjens blokbredder', () => {
  const axis = makeAxis();
  it('bredden er nætter / 18 dage', () => {
    const w = STAYS.map((s) => blockLayout(axis, s).widthPct);
    expect(w[0]).toBeCloseTo((1 / 18) * 100);
    expect(w[1]).toBeCloseTo((3 / 18) * 100);
    expect(w[2]).toBeCloseTo((7 / 18) * 100);
    expect(w[3]).toBeCloseTo((5 / 18) * 100);
  });
  it('bredden er proportional med nætterne, og blokkene støder op til hinanden', () => {
    const b = STAYS.map((s) => blockLayout(axis, s));
    expect(b[2].widthPct / b[0].widthPct).toBeCloseTo(7);
    for (let i = 1; i < b.length; i++) {
      expect(b[i].leftPct).toBeCloseTo(b[i - 1].leftPct + b[i - 1].widthPct);
    }
    expect(b[0].leftPct).toBeCloseTo(positionPct(axis, '2026-12-26'));
  });
  it('transport-etiketter der ligger tæt, kommer på hver sin bane', () => {
    expect(assignLanes([2.5, 8.7, 16.1, 16.2, 30, 94.1, 97], 10)).toEqual([0, 1, 0, 2, 0, 0, 1]);
  });
  it('nu-linjen vises kun under rejsen', () => {
    expect(todayPct(axis, new Date(2026, 8, 29, 12))).toBeNull();
    expect(todayPct(axis, new Date(2026, 11, 26, 0))).toBeCloseTo(0);
    expect(todayPct(axis, new Date(2027, 0, 12, 12))).toBeCloseTo((17.5 / 18) * 100);
    expect(todayPct(axis, new Date(2027, 0, 13, 12))).toBeNull();
  });
});

describe('samlet pris med manglende priser', () => {
  it('lægger kun kendte priser sammen og tæller de ukendte', () => {
    const r = priceTotal([{ price_dkk: 2016 }, { price_dkk: null }, { price_dkk: '11300.00' }, { price_dkk: null }]);
    expect(r).toEqual({ total: 13316, medPris: 2, udenPris: 2 });
  });
  it('en pris på 0 er kendt, ikke manglende', () => {
    expect(priceTotal([{ price_dkk: 0 }, { price_dkk: null }])).toEqual({ total: 0, medPris: 1, udenPris: 1 });
  });
  it('et tomt prisfelt bliver null (ukendt), ikke 0', () => {
    expect(parseBelob('')).toBeNull();
    expect(parseBelob('  ')).toBeNull();
    expect(parseBelob('0')).toBe(0);
    expect(parseBelob('11.300')).toBe(11300);
    expect(parseBelob('167 212')).toBe(167212);
    expect(parseBelob('2016,50')).toBe(2016.5);
    expect(parseBelob('1.234,5 kr.')).toBe(1234.5);
    expect(() => parseBelob('abc')).toThrow();
  });
  it('ingen priser giver 0 med alle talt som ukendte', () => {
    expect(priceTotal([{ price_dkk: null }])).toEqual({ total: 0, medPris: 0, udenPris: 1 });
  });
});

describe('nærmeste destination for et sted', () => {
  it('vælger destinationen med det nærmeste ophold', () => {
    expect(nearestDestinationId({ lat: 21.0253, lng: 105.8465 }, STAYS)).toBe('hanoi'); // Hoa Lo-fængslet
    expect(nearestDestinationId({ lat: 12.2388, lng: 109.1967 }, STAYS)).toBe('ninhvan'); // Nha Trang
    expect(nearestDestinationId({ lat: 10.7769, lng: 106.7009 }, STAYS)).toBe('saigon'); // Ben Thanh
    expect(nearestDestinationId({ lat: 10.93, lng: 108.1 }, STAYS)).toBe('kega'); // Phan Thiet
  });
  it('springer ophold uden placering over og giver null, hvis ingen har en', () => {
    const uden = STAYS.map((s) => ({ ...s, lat: null, lng: null }));
    expect(nearestDestinationId({ lat: 21, lng: 105 }, uden)).toBeNull();
    expect(nearestDestinationId({ lat: 21, lng: 105 }, [...uden.slice(1), STAYS[0]])).toBe('saigon');
  });
});

describe('ruten', () => {
  const T = [
    { id: 'ud', date: '2026-12-26', departs_at: '10:50:00', kind: 'fly' as const },
    { id: 'han', date: '2026-12-27', departs_at: '13:40:00', kind: 'fly' as const },
    { id: 'cxr', date: '2026-12-30', departs_at: '10:30:00', kind: 'fly' as const },
    { id: 'baad', date: '2026-12-30', departs_at: null, kind: 'båd' as const },
    { id: 'kega', date: '2027-01-06', departs_at: null, kind: 'bil' as const },
    { id: 'sgn', date: '2027-01-11', departs_at: null, kind: 'bil' as const },
    { id: 'hjem', date: '2027-01-11', departs_at: '22:45:00', kind: 'fly' as const },
  ];
  it('stiplet på ben med fly, fuld på bil/båd; flyet hjem tæller ikke med i benet til SGN', () => {
    expect(routeLegs(STAYS, T).map((l) => [l.fraStayId, l.tilStayId, l.medFly])).toEqual([
      ['hi', 'aira', true],
      ['aira', 'six', true],
      ['six', 'azerai', false],
      ['azerai', null, false],
    ]);
  });
});

describe('aktiviteter', () => {
  it('Planlagt sorteres efter dato og tid på dagen; Ønsker er dem uden dato', () => {
    const { planlagt, oensker } = splitActivities([
      { title: 'Nytår', date: '2026-12-31', time_of_day: 'aften' as const },
      { title: 'Kajak', date: null, time_of_day: null },
      { title: 'Snorkel', date: '2026-12-31', time_of_day: 'morgen' as const },
      { title: 'Spa', date: '2027-01-02', time_of_day: null },
    ]);
    expect(planlagt.map((a) => a.title)).toEqual(['Snorkel', 'Nytår', 'Spa']);
    expect(oensker.map((a) => a.title)).toEqual(['Kajak']);
  });
  it('datoen begrænses til destinationens opholdsperiode', () => {
    expect(destinationPeriod('ninhvan', STAYS)).toEqual({ min: '2026-12-30', max: '2027-01-06' });
    expect(destinationPeriod('ukendt', STAYS)).toBeNull();
  });
});

describe('tidsvisning', () => {
  it('markerer ankomst næste dag med (+1)', () => {
    expect(formatTimeSpan('10:50:00', '04:30:00')).toBe('10:50–04:30 (+1)');
    expect(formatTimeSpan('13:40:00', '15:50:00')).toBe('13:40–15:50');
    expect(formatTimeSpan(null, null)).toBe('');
  });
});
