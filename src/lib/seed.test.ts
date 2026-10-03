import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// supabase/seed.sql (til SQL Editor) og scripts/seed.ts (npm run seed) skal
// indsætte samme plan. Testen trækker navne og datoer ud af begge filer og
// sammenligner, så de ikke kan glide fra hinanden.

const ts = readFileSync(new URL('../../scripts/seed.ts', import.meta.url), 'utf8');
const sql = readFileSync(new URL('../../supabase/seed.sql', import.meta.url), 'utf8');

const alle = (tekst: string, re: RegExp) => [...tekst.matchAll(re)].map((m) => m.slice(1).join(' | ')).sort();

// Afsnittet mellem to markører (fx "── Hoteller" og "── Transport") i SQL-filen.
function afsnit(fra: string, til: string): string {
  const start = sql.indexOf(fra);
  const slut = sql.indexOf(til, start);
  if (start === -1 || slut === -1) throw new Error(`Fandt ikke afsnittet ${fra} → ${til} i seed.sql`);
  return sql.slice(start, slut);
}

const D = String.raw`(\d{4}-\d{2}-\d{2})`;

describe('seed.sql og seed.ts har samme data', () => {
  it('hoteller: navn, check-in og check-ud', () => {
    const fraTs = alle(ts, new RegExp(String.raw`name: '([^']+)',\s*check_in: '${D}',\s*check_out: '${D}'`, 'g'));
    const fraSql = alle(
      afsnit('── Hoteller', '── Transport'),
      new RegExp(String.raw`'([^']+)',\s*date '${D}', date '${D}'`, 'g'),
    );
    expect(fraTs).toHaveLength(3);
    expect(fraSql).toEqual(fraTs);
  });

  it('transport: dato, type, fra og til', () => {
    const fraTs = alle(
      ts,
      new RegExp(String.raw`date: '${D}', kind: '([^']+)', from_place: '([^']+)', to_place: '([^']+)'`, 'g'),
    );
    const fraSql = alle(
      afsnit('── Transport', '── Kontrol'),
      new RegExp(String.raw`\(date '${D}', '([^']+)', '([^']+)',\s*'([^']+)'`, 'g'),
    );
    expect(fraTs).toHaveLength(6);
    expect(fraSql).toEqual(fraTs);
  });

  it('aktiviteter: ingen af de to seeds indsætter aktiviteter', () => {
    expect(ts).not.toMatch(/sikr\(\s*'activities'/);
    expect(sql).not.toMatch(/insert into public\.activities/);
  });

  it('destinationer: navn og rækkefølge', () => {
    const fraTs = alle(ts, /\{ name: '([^']+)', area: '[^']*', color: '#[0-9A-F]{6}', sort_order: (\d+) \}/g);
    const fraSql = alle(afsnit('── Destinationer', '── Hoteller'), /\('([^']+)',\s*'[^']*',\s*'#[0-9A-F]{6}', (\d+)\)/g);
    expect(fraTs).toHaveLength(3);
    expect(fraSql).toEqual(fraTs);
  });

  it('seed.sql er ren SQL i én transaktion uden psql-metakommandoer', () => {
    expect(sql).not.toMatch(/^\s*\\/m);
    expect(sql.match(/^begin;$/gm)).toHaveLength(1);
    expect(sql.trimEnd().endsWith('commit;')).toBe(true);
  });
});
