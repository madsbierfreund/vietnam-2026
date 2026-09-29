import { describe, expect, it } from 'vitest';
import { kanRedigere, redigeringsFejl, rolleFraProfil } from './rolle';

describe('roller', () => {
  it('manglende profil eller ukendt rolle er læser (fail closed)', () => {
    expect(rolleFraProfil(null)).toBe('læser');
    expect(rolleFraProfil(undefined)).toBe('læser');
    expect(rolleFraProfil({ role: 'admin' })).toBe('læser');
    expect(rolleFraProfil({ role: '' })).toBe('læser');
    expect(rolleFraProfil({ role: 'læser' })).toBe('læser');
    expect(rolleFraProfil({ role: 'redaktør' })).toBe('redaktør');
  });

  it('læser kan ikke redigere', () => {
    expect(kanRedigere('læser')).toBe(false);
    expect(kanRedigere(rolleFraProfil(null))).toBe(false);
    expect(redigeringsFejl('læser', 'gemme hotellet')).toBe(
      'Kunne ikke gemme hotellet: du har kun læseadgang (rolle: læser).',
    );
  });

  it('redaktør kan redigere', () => {
    expect(kanRedigere('redaktør')).toBe(true);
    expect(redigeringsFejl('redaktør', 'gemme hotellet')).toBeNull();
  });
});
