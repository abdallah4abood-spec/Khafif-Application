import ar from '@/i18n/ar.json';
import en from '@/i18n/en.json';
import { isRtlLocale, pickLocale } from '@/i18n';

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null
      ? keys(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );
}

describe('i18n', () => {
  it('has identical key sets in ar and en (missing-key guard)', () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort());
  });

  it('has no empty strings', () => {
    for (const dict of [ar, en]) {
      for (const k of keys(dict)) {
        const value = k.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], dict);
        expect(typeof value === 'string' && value.trim().length > 0).toBe(true);
      }
    }
  });

  it('picks en only for English devices, otherwise falls back to ar', () => {
    expect(pickLocale('en')).toBe('en');
    expect(pickLocale('ar')).toBe('ar');
    expect(pickLocale('fr')).toBe('ar');
    expect(pickLocale(null)).toBe('ar');
  });

  it('marks only Arabic as RTL', () => {
    expect(isRtlLocale('ar')).toBe(true);
    expect(isRtlLocale('en')).toBe(false);
  });
});
