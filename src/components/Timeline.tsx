'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Activity, Destination, Stay, Transport } from '@/lib/types';
import { formatDate, formatTime, nightsLabel, tripDays } from '@/lib/trip/dates';
import { TID_PAA_DAGEN_BROEK, assignLanes, blockLayout, makeAxis, positionPct, timeFraction, todayPct } from '@/lib/trip/timeline';
import { sortStays, sortTransport } from '@/lib/trip/route';
import { TransportIcon } from './TransportIcon';

const UGEDAG = ['sø', 'ma', 'ti', 'on', 'to', 'fr', 'lø'];
const MAANED = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'];

// Flynummer (fx "VJ138") hvis det står i teksten. Resten står i etikettens title.
function flynummer(t: Transport): string {
  return t.carrier_and_number.match(/\b[A-Z0-9]{2}\s?\d{2,4}\b/)?.[0] ?? '';
}

export function Timeline({
  destinations,
  stays,
  transport,
  activities,
  aktivDestinationId,
  onVaelg,
}: {
  destinations: Destination[];
  stays: Stay[];
  transport: Transport[];
  activities: Activity[];
  aktivDestinationId: string | null;
  onVaelg: (destinationId: string) => void;
}) {
  const axis = useMemo(() => makeAxis(), []);
  const dage = useMemo(() => tripDays(), []);
  const farve = useMemo(() => new Map(destinations.map((d) => [d.id, d.color])), [destinations]);
  const dagBredde = 100 / axis.antalDage;

  // Nu-linjen beregnes kun i browseren (enhedens tid) og opdateres hvert minut.
  const [nu, setNu] = useState<number | null>(null);
  useEffect(() => {
    const opdater = () => setNu(todayPct(axis, new Date()));
    opdater();
    const t = setInterval(opdater, 60_000);
    return () => clearInterval(t);
  }, [axis]);

  // Hver transport ved sin afgangstid (uden tid: midt på dagen), fordelt på baner så etiketterne ikke overlapper.
  const transportEtiketter = useMemo(() => {
    const liste = sortTransport(transport).map((t) => ({ t, pct: positionPct(axis, t.date, timeFraction(t.departs_at) ?? 0.5) }));
    liste.sort((a, b) => a.pct - b.pct);
    const baner = assignLanes(liste.map((x) => x.pct), 9);
    return liste.map((x, i) => ({ ...x, bane: baner[i] }));
  }, [transport, axis]);
  const antalBaner = Math.max(1, ...transportEtiketter.map((x) => x.bane + 1));

  // Aktiviteter med dato som prikker; flere på samme dag forskydes lidt.
  const prikker = useMemo(() => {
    const perDag = new Map<string, number>();
    return activities
      .filter((a) => a.date !== null)
      .sort((a, b) => a.date!.localeCompare(b.date!))
      .map((a) => {
        const n = perDag.get(a.date!) ?? 0;
        perDag.set(a.date!, n + 1);
        const broek = a.time_of_day ? TID_PAA_DAGEN_BROEK[a.time_of_day] : 0.5;
        return { a, pct: positionPct(axis, a.date!, broek), forskyd: n };
      });
  }, [activities, axis]);

  return (
    <div className="tidslinje-wrap" aria-label="Tidslinje">
      <div className="tidslinje">
        <div className="tl-dage">
          {dage.map((d, i) => {
            const [, m, dag] = d.split('-').map(Number);
            const ugedag = UGEDAG[new Date(`${d}T00:00:00Z`).getUTCDay()];
            return (
              <div key={d} className="tl-dag num" style={{ left: `${i * dagBredde}%`, width: `${dagBredde}%` }}>
                <strong>
                  {dag}
                  {i === 0 || dag === 1 ? ` ${MAANED[m - 1]}` : ''}
                </strong>
                {ugedag}
              </div>
            );
          })}
        </div>

        <div className="tl-blokke">
          {sortStays(stays).map((s) => {
            const b = blockLayout(axis, s);
            return (
              <button
                key={s.id}
                type="button"
                className={`tl-blok${aktivDestinationId === s.destination_id ? ' aktiv' : ''}`}
                style={{ left: `${b.leftPct}%`, width: `${b.widthPct}%`, background: farve.get(s.destination_id) }}
                onClick={() => onVaelg(s.destination_id)}
                title={`${s.name} · ${formatDate(s.check_in)} – ${formatDate(s.check_out)} · ${nightsLabel(b.nights)}`}
              >
                <span className="navn">{s.name}</span>
                <span className="naetter num">{nightsLabel(b.nights)}</span>
              </button>
            );
          })}
        </div>

        <div className="tl-prikker">
          {prikker.map(({ a, pct, forskyd }) => (
            <Link
              key={a.id}
              href={`/aktivitet/${a.id}`}
              className="tl-prik"
              style={{
                left: `calc(${pct}% + ${forskyd * 0.7}rem)`,
                background: farve.get(a.destination_id),
              }}
              title={`${a.title} · ${formatDate(a.date!)}${a.time_of_day ? `, ${a.time_of_day}` : ''}`}
              aria-label={a.title}
            />
          ))}
        </div>

        <div className="tl-transport" style={{ height: `${antalBaner * 1.5}rem` }}>
          {transportEtiketter.map(({ t, pct, bane }) => (
            <Link
              key={t.id}
              href={`/transport/${t.id}`}
              className="tl-t num"
              style={{
                left: `${pct}%`,
                top: `${bane * 1.5}rem`,
                transform: pct < 4 ? 'translateX(-0.4rem)' : pct > 96 ? 'translateX(calc(-100% + 0.4rem))' : undefined,
              }}
              title={`${t.kind}: ${t.from_place} → ${t.to_place}${t.carrier_and_number ? ` · ${t.carrier_and_number}` : ''}${t.departs_at ? ` · ${formatTime(t.departs_at)}` : ''}`}
              aria-label={`${t.kind} ${t.from_place} til ${t.to_place}`}
            >
              <TransportIcon kind={t.kind} />
              {[formatTime(t.departs_at), flynummer(t)].filter(Boolean).join(' ')}
            </Link>
          ))}
        </div>

        {nu !== null ? (
          <div className="tl-nu" style={{ left: `${nu}%` }}>
            <span>I dag</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
