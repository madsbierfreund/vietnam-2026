'use client';

import { useState, useTransition } from 'react';

// Slet med bekræftelse. Handlingen omdirigerer ved succes eller returnerer en fejltekst.
export function SletKnap({
  handling,
  hvad,
}: {
  handling: () => Promise<string | null>;
  hvad: string;
}) {
  const [fejl, setFejl] = useState<string | null>(null);
  const [arbejder, start] = useTransition();

  return (
    <>
      <button
        type="button"
        className="btn btn-danger"
        disabled={arbejder}
        onClick={() => {
          if (!window.confirm(`Slet ${hvad}? Det kan ikke fortrydes.`)) return;
          start(async () => {
            const svar = await handling();
            if (svar) setFejl(svar);
          });
        }}
      >
        {arbejder ? 'Sletter …' : 'Slet'}
      </button>
      {fejl ? <p className="fejl">{fejl}</p> : null}
    </>
  );
}
