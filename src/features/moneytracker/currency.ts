// Currency codes are rendered everywhere an amount is shown. A symbol is
// shorter and more scannable than a 3-letter code, so this is the single
// place that maps one to the other — every amount display should go
// through this instead of rendering the raw code.
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
}

// Falls back to the raw code for any currency without a mapped symbol,
// rather than showing nothing.
export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency
}
