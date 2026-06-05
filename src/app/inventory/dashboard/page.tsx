import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import StatsCards       from '@/features/dashboard/components/StatsCards'
import ConsumptionChart from '@/features/dashboard/components/ConsumptionChart'
import TopProducts      from '@/features/dashboard/components/TopProducts'
import ActiveAlerts     from '@/features/dashboard/components/ActiveAlerts'
import RealtimeRefresher from '@/features/dashboard/components/RealtimeRefresher'
import { getAppCurrency } from '@/lib/currency'
import {
  getDashboardStats,
  getWeeklyChartData,
  getTopProducts,
  getActiveAlerts,
} from '@/features/dashboard/queries'

export default async function DashboardPage() {
  const [stats, chartData, topProducts, activeAlerts, currency] = await Promise.all([
    getDashboardStats(),
    getWeeklyChartData(),
    getTopProducts(),
    getActiveAlerts(),
    getAppCurrency(),
  ])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Realtime: silently refreshes when new alerts or movements arrive */}
      <RealtimeRefresher />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Button size="sm" render={<Link href="/inventory/movements/new" />}>
          <Plus className="h-4 w-4 mr-1" />
          Registrar movimiento
        </Button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} currency={currency} />

      {/* Alerts + Chart — side by side on desktop */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Active alerts */}
        <section className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Alertas activas</h2>
            {activeAlerts.length > 0 && (
              <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                {activeAlerts.length}
              </span>
            )}
          </div>
          <ActiveAlerts alerts={activeAlerts} />
        </section>

        {/* Weekly chart */}
        <section className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Consumo semanal</h2>
          <ConsumptionChart data={chartData} />
        </section>
      </div>

      {/* Top products */}
      <section className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">
          Top 10 productos más usados
          <span className="font-normal text-muted-foreground ml-1">(últimos 30 días)</span>
        </h2>
        <TopProducts products={topProducts} />
      </section>
    </div>
  )
}
