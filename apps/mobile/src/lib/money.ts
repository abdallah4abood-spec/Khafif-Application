export function formatMoney(amount: number | null | undefined, currencyCode: string | null | undefined, locale: 'ar' | 'en'): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '—';

  try {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-PS' : 'en-IL', {
      style: 'currency',
      currency: (currencyCode ?? 'ils').toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${(currencyCode ?? 'ILS').toUpperCase()}`;
  }
}
