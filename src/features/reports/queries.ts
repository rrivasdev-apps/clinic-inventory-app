'use server'

import { createClient } from '@/lib/supabase/server'
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import type { Movement, Product } from '@/types'

export type ConsumptionPeriod = 'daily' | 'weekly' | 'monthly'

export interface ConsumptionRow {
  period:      string
  totalEntry:  number   // sum of positive quantities
  totalExit:   number   // sum of absolute value of negative quantities
  netChange:   number   // entry - exit
}

export interface StockValueRow {
  product_id:  string
  name:        string
  stock:       number
  price:       number | null
  value:       number   // stock * price
}

export interface MovementExportRow {
  date:        string
  product:     string
  type:        string
  quantity:    number
  unit:        string
  notes:       string | null
}

export async function getConsumptionReport(
  period: ConsumptionPeriod,
  days: number = 30
): Promise<ConsumptionRow[]> {
  const supabase = await createClient()
  const since = subDays(new Date(), days).toISOString()

  const { data: movements } = await supabase
    .from('movements')
    .select('quantity, created_at')
    .gte('created_at', since)
    .order('created_at')

  if (!movements || movements.length === 0) return []

  const grouped: Record<string, { entry: number; exit: number }> = {}

  for (const m of movements) {
    let key: string
    const date = new Date(m.created_at)

    if (period === 'daily') {
      key = startOfDay(date).toISOString().split('T')[0]
    } else if (period === 'weekly') {
      const start = startOfWeek(date, { weekStartsOn: 1 })
      const end = endOfWeek(date, { weekStartsOn: 1 })
      key = `${start.toISOString().split('T')[0]} — ${end.toISOString().split('T')[0]}`
    } else {
      const start = startOfMonth(date)
      key = start.toISOString().split('T')[0].slice(0, 7)
    }

    if (!grouped[key]) grouped[key] = { entry: 0, exit: 0 }
    if (m.quantity > 0) grouped[key].entry += m.quantity
    else grouped[key].exit += Math.abs(m.quantity)
  }

  return Object.entries(grouped).map(([period, { entry, exit }]) => ({
    period,
    totalEntry:  entry,
    totalExit:   exit,
    netChange:   entry - exit,
  }))
}

export async function getStockValueReport(): Promise<StockValueRow[]> {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, stock_current, price')
    .eq('is_active', true)
    .order('name')

  if (!products) return []

  return products
    .map((p) => ({
      product_id: p.id,
      name:       p.name,
      stock:      p.stock_current,
      price:      p.price,
      value:      p.stock_current * (p.price ?? 0),
    }))
    .filter((row) => row.value > 0)
}

export async function getMovementExportData(
  days: number = 90
): Promise<MovementExportRow[]> {
  const supabase = await createClient()
  const since = subDays(new Date(), days).toISOString()

  const { data: movements } = await supabase
    .from('movements')
    .select('quantity, type, created_at, notes, product:products(name, unit)')
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (!movements) return []

  return movements.map((m) => ({
    date:     new Date(m.created_at).toLocaleDateString('es-CR'),
    product:  (m.product as any)?.name ?? '—',
    type:     m.type,
    quantity: Math.abs(m.quantity),
    unit:     (m.product as any)?.unit ?? '',
    notes:    m.notes,
  }))
}
