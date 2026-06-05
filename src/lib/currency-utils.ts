// Pure formatting functions — can be used anywhere (Server or Client Components)

const DEFAULT_CURRENCY = 'CRC'

export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY, locale: string = 'es-CR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCurrencyNoFractions(amount: number, currency: string = DEFAULT_CURRENCY, locale: string = 'es-CR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
