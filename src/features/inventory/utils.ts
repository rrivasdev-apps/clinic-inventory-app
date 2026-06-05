import type { Product } from '@/types'

export type StockStatus = 'normal' | 'low' | 'critical' | 'empty'

export function getStockStatus(product: Pick<Product, 'stock_current' | 'stock_minimum'>): StockStatus {
  if (product.stock_current <= 0) return 'empty'
  if (product.stock_current <= product.stock_minimum) return 'critical'
  if (product.stock_current <= product.stock_minimum * 1.5) return 'low'
  return 'normal'
}

export const stockStatusConfig: Record<StockStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  normal:   { label: 'Normal',   variant: 'secondary',    className: 'bg-green-100 text-green-800 border-green-200' },
  low:      { label: 'Bajo',     variant: 'outline',      className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  critical: { label: 'Crítico',  variant: 'destructive',  className: 'bg-orange-100 text-orange-800 border-orange-200' },
  empty:    { label: 'Agotado',  variant: 'destructive',  className: 'bg-red-100 text-red-800 border-red-200' },
}
