import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import StockStatusBadge from '@/components/stock-status-badge'
import { resolveAlert } from '@/features/alerts/actions'
import { createClient } from '@/lib/supabase/server'
import type { Alert, Product } from '@/types'

type AlertWithProduct = Alert & {
  product: Pick<Product, 'id' | 'name' | 'unit' | 'stock_current' | 'stock_minimum'> | null
}

export default async function AlertsPage() {
  const supabase = await createClient()

  const { data: active } = await supabase
    .from('alerts')
    .select('*, product:products(id, name, unit, stock_current, stock_minimum)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const { data: resolved } = await supabase
    .from('alerts')
    .select('*, product:products(id, name, unit, stock_current, stock_minimum)')
    .eq('status', 'resolved')
    .order('resolved_at', { ascending: false })
    .limit(30)

  const activeAlerts   = (active   ?? []) as AlertWithProduct[]
  const resolvedAlerts = (resolved ?? []) as AlertWithProduct[]

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-xl font-semibold">Alertas de stock</h1>

      {/* Active alerts */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Activas</h2>
          {activeAlerts.length > 0 && (
            <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
              {activeAlerts.length}
            </span>
          )}
        </div>

        {activeAlerts.length === 0 ? (
          <div className="flex items-center gap-2 text-green-700 text-sm rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Todos los niveles de stock están bien
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Stock al alertar</TableHead>
                  <TableHead>Estado actual</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{alert.product?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{alert.product?.unit}</p>
                    </TableCell>
                    <TableCell className="tabular-nums text-sm text-orange-700 font-semibold">
                      {alert.stock_at_alert}
                    </TableCell>
                    <TableCell>
                      {alert.product && (
                        <StockStatusBadge
                          stockCurrent={alert.product.stock_current}
                          stockMinimum={alert.product.stock_minimum}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(alert.created_at), "d MMM, HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <form action={resolveAlert.bind(null, alert.id)}>
                        <Button type="submit" variant="outline" size="sm">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Resolver
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Resolved alerts history */}
      {resolvedAlerts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Historial reciente (últimas 30)
          </h2>
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Stock al alertar</TableHead>
                  <TableHead>Resuelta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolvedAlerts.map((alert) => (
                  <TableRow key={alert.id} className="opacity-60">
                    <TableCell className="text-sm">{alert.product?.name ?? '—'}</TableCell>
                    <TableCell className="tabular-nums text-sm">{alert.stock_at_alert}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {alert.resolved_at
                        ? format(new Date(alert.resolved_at), "d MMM, HH:mm", { locale: es })
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  )
}
