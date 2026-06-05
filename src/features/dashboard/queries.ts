import { createClient } from '@/lib/supabase/server'
import { subDays, startOfDay, format } from 'date-fns'
import type { Alert, Product } from '@/types'

export interface DashboardStats {
  totalProducts: number
  activeAlerts: number
  todayMovements: number
  inventoryValue: number | null
}

export interface DailyMovement {
  date: string
  entradas: number
  salidas: number
}

export interface TopProduct {
  id: string
  name: string
  unit: string
  totalUsage: number
}

export type AlertWithProduct = Alert & {
  product: Pick<Product, 'id' | 'name' | 'unit' | 'stock_current' | 'stock_minimum'> | null
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const todayStart = startOfDay(new Date()).toISOString()

  // Run all queries; use safe defaults if any fail — dashboard should never crash
  const [products, alerts, movements, value] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('alerts').select('id',   { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('movements').select('id',{ count: 'exact', head: true }).gte('created_at', todayStart),
    supabase.from('products').select('stock_current, price').eq('is_active', true).not('price', 'is', null),
  ])

  const inventoryValue = value.data && !value.error
    ? value.data.reduce((sum, p) => sum + (p.stock_current * (p.price ?? 0)), 0)
    : null

  return {
    totalProducts:  products.error  ? 0 : (products.count  ?? 0),
    activeAlerts:   alerts.error    ? 0 : (alerts.count    ?? 0),
    todayMovements: movements.error ? 0 : (movements.count ?? 0),
    inventoryValue: inventoryValue && inventoryValue > 0 ? inventoryValue : null,
  }
}

export async function getWeeklyChartData(): Promise<DailyMovement[]> {
  // Pre-fill 7 days so the chart always renders even if the query fails
  const emptyDays: Record<string, { entradas: number; salidas: number }> = {}
  for (let i = 6; i >= 0; i--) {
    emptyDays[format(subDays(new Date(), i), 'dd/MM')] = { entradas: 0, salidas: 0 }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('movements')
    .select('quantity, created_at')
    .gte('created_at', subDays(new Date(), 6).toISOString())
    .order('created_at')

  if (error) {
    return Object.entries(emptyDays).map(([date, v]) => ({ date, ...v }))
  }

  for (const m of data ?? []) {
    const key = format(new Date(m.created_at), 'dd/MM')
    if (!emptyDays[key]) emptyDays[key] = { entradas: 0, salidas: 0 }
    if (m.quantity > 0) emptyDays[key].entradas += m.quantity
    else                emptyDays[key].salidas  += Math.abs(m.quantity)
  }

  return Object.entries(emptyDays).map(([date, v]) => ({ date, ...v }))
}

export async function getTopProducts(): Promise<TopProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('movements')
    .select('product_id, quantity, product:products(id, name, unit)')
    .lt('quantity', 0)
    .gte('created_at', subDays(new Date(), 30).toISOString())

  if (error || !data) return []

  const usage: Record<string, TopProduct> = {}
  for (const m of data) {
    const p = m.product as { id: string; name: string; unit: string } | null
    if (!p) continue
    if (!usage[p.id]) usage[p.id] = { id: p.id, name: p.name, unit: p.unit, totalUsage: 0 }
    usage[p.id].totalUsage += Math.abs(m.quantity)
  }

  return Object.values(usage).sort((a, b) => b.totalUsage - a.totalUsage).slice(0, 10)
}

export async function getActiveAlerts(): Promise<AlertWithProduct[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('alerts')
    .select('*, product:products(id, name, unit, stock_current, stock_minimum)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return (data ?? []) as AlertWithProduct[]
}
