'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { saetPlacering } from '@/app/actions';
import type { PickedPlace } from '@/lib/types';
import { PlaceSearch } from './maps/PlaceSearch';

export type UdenPlacering = { tabel: 'stays' | 'activities'; id: string; navn: string; type: string };

// Listen under kortet: hoteller og aktiviteter uden placering, hver med en knap
// der åbner stedsøgningen. Valget gemmes med det samme.
export function ManglerPlacering({ poster }: { poster: UdenPlacering[] }) {
  if (poster.length === 0) return null;
  return (
    <section className="mangler" aria-label="Mangler placering">
      <h3>Mangler placering</h3>
      <ul>
        {poster.map((p) => (
          <Post key={`${p.tabel}-${p.id}`} post={p} />
        ))}
      </ul>
    </section>
  );
}

function Post({ post }: { post: UdenPlacering }) {
  const router = useRouter();
  const [aaben, setAaben] = useState(false);
  const [gemmer, setGemmer] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);

  async function gem(sted: PickedPlace) {
    setGemmer(true);
    setFejl(null);
    try {
      const svar = await saetPlacering(post.tabel, post.id, sted);
      if (svar) {
        setFejl(svar);
      } else {
        setAaben(false);
        router.refresh();
      }
    } catch (e) {
      setFejl(`Kunne ikke gemme placeringen: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGemmer(false);
    }
  }

  return (
    <li>
      <div className="raekke">
        <span>
          {post.navn} <span className="muted small">· {post.type}</span>
        </span>
        <button type="button" className="btn btn-small" onClick={() => setAaben((v) => !v)} disabled={gemmer}>
          {aaben ? 'Luk' : 'Søg placering'}
        </button>
      </div>
      {aaben ? <PlaceSearch onPick={gem} autoFocus placeholder={`Søg efter ${post.navn}`} /> : null}
      {gemmer ? <p className="muted small">Gemmer …</p> : null}
      {fejl ? <p className="fejl">{fejl}</p> : null}
    </li>
  );
}
