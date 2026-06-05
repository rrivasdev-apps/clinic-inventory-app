import Link from 'next/link'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import StockStatusBadge from '@/components/stock-status-badge'
import type { AlertWithProduct } from '../queries'

interface Props {
  alerts: AlertWithProduct[]
}

export default function ActiveAlerts({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-700 text-sm py-2">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>Todos los niveles de stock están bien</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const p = alert.product
        if (!p) return null
        return (
          <div
            key={alert.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  Stock: <span className="font-semibold text-orange-700">{p.stock_current}</span>
                  {' '}/{' '}{p.stock_minimum} mín · {p.unit}
                </p>
              </div>
            </div>
            <StockStatusBadge
              stockCurrent={p.stock_current}
              stockMinimum={p.stock_minimum}
              className="shrink-0"
            />
          </div>
        )
      })}

      <Button
        variant="outline"
        size="sm"
        className="w-full mt-1"
        render={<Link href="/inventory/alerts" />}
      >
        Ver todas las alertas
      </Button>
    </div>
  )
}
