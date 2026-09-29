'use client';

import Link from 'next/link';
import { gemTransport } from '@/app/actions';
import { TRANSPORT_KINDS, type Transport } from '@/lib/types';
import { TRIP_END, TRIP_START, formatTime } from '@/lib/trip/dates';
import { StatusSelect } from './StatusSelect';
import { useFormular } from './useFormular';

export function TransportForm({ transport }: { transport?: Transport }) {
  const { fejl, gemmer, onSubmit } = useFormular(gemTransport);
  const t = transport;

  return (
    <form onSubmit={onSubmit} className="form">
      {t ? <input type="hidden" name="id" value={t.id} /> : null}

      <div className="felt-par">
        <label className="felt">
          <span>Dato</span>
          <input type="date" name="date" required min={TRIP_START} max={TRIP_END} defaultValue={t?.date} />
        </label>
        <label className="felt">
          <span>Type</span>
          <select name="kind" defaultValue={t?.kind ?? 'fly'}>
            {TRANSPORT_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="felt-par">
        <label className="felt">
          <span>Afgang</span>
          <input type="time" name="departs_at" defaultValue={formatTime(t?.departs_at ?? null)} />
        </label>
        <label className="felt">
          <span>Ankomst</span>
          <input type="time" name="arrives_at" defaultValue={formatTime(t?.arrives_at ?? null)} />
          <span className="hjaelp">Ankomst før afgang vises som næste dag (+1).</span>
        </label>
      </div>

      <div className="felt-par">
        <label className="felt">
          <span>Fra</span>
          <input name="from_place" defaultValue={t?.from_place} />
        </label>
        <label className="felt">
          <span>Til</span>
          <input name="to_place" defaultValue={t?.to_place} />
        </label>
      </div>

      <label className="felt">
        <span>Selskab og nummer</span>
        <input name="carrier_and_number" defaultValue={t?.carrier_and_number} placeholder="fx Vietjet VJ138" />
      </label>

      <label className="felt">
        <span>Beskrivelse</span>
        <textarea name="description" rows={3} defaultValue={t?.description} />
      </label>

      <StatusSelect vaerdi={t?.status ?? 'idé'} />

      {fejl ? <p className="fejl">{fejl}</p> : null}

      <div className="btn-row">
        <button type="submit" className="btn btn-primary" disabled={gemmer}>
          {gemmer ? 'Gemmer …' : 'Gem transport'}
        </button>
        <Link href="/" className="btn">
          Annullér
        </Link>
      </div>
    </form>
  );
}
