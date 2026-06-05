'use client'

import { Package, Bell, ArrowRightLeft, DollarSign } from 'lucide-react'
import { formatCurrencyNoFractions } from '@/lib/currency-utils'
import type { DashboardStats } from '../queries'

interface Props {
  stats: DashboardStats
  currency: string
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  accent?: 'warning' | 'danger'
}) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className={`text-2xl font-bold tabular-nums ${
        accent === 'danger'  ? 'text-red-600' :
        accent === 'warning' ? 'text-orange-600' :
        'text-foreground'
      }`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export default function StatsCards({ stats, currency }: Props) {
  const { totalProducts, activeAlerts, todayMovements, inventoryValue } = stats

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={Package}
        label="Productos"
        value={totalProducts}
        sub="activos en catálogo"
      />
      <StatCard
        icon={Bell}
        label="Alertas"
        value={activeAlerts}
        sub={activeAlerts === 0 ? 'sin stock crítico' : 'requieren atención'}
        accent={activeAlerts > 0 ? 'danger' : undefined}
      />
      <StatCard
        icon={ArrowRightLeft}
        label="Hoy"
        value={todayMovements}
        sub="movimientos registrados"
      />
      <StatCard
        icon={DollarSign}
        label="Valor"
        value={inventoryValue !== null
          ? formatCurrencyNoFractions(inventoryValue, currency)
          : '—'
        }
        sub={inventoryValue !== null ? 'valor total inventario' : 'sin precios configurados'}
      />
    </div>
  )
}
