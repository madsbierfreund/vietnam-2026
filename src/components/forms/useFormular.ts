'use client';

import { startTransition, useActionState, type FormEvent } from 'react';

// Kører en server action fra onSubmit i stedet for <form action>. React 19
// nulstiller ellers formularen efter hver indsendelse — også når handlingen
// returnerer en fejl — og brugerens indtastning ville gå tabt.
export function useFormular(handling: (forrige: string | null, fd: FormData) => Promise<string | null>) {
  const [fejl, koer, gemmer] = useActionState(handling, null);
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => koer(fd));
  }
  return { fejl, gemmer, onSubmit };
}
