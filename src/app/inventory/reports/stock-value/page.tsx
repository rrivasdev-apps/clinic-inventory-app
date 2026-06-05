'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getStockValueReport } from '@/features/reports/queries'
import { exportStockValueCSV } from '@/features/reports/actions'
import { formatCurrency } from '@/lib/currency-utils'

const DEFAULT_CURRENCY = 'CRC'

export default function StockValueReportPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getStockValueReport>>>([])
  const [loading, setLoading] = useState(false)

  async function loadReport() {
    setLoading(true)
    const result = await getStockValueReport()
    setData(result)
    setLoading(false)
  }

  async function handleExport() {
    const csv = await exportStockValueCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `valuacion-inventario-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const total = data.reduce((sum, r) => sum + r.value, 0)

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">Valor del Inventario</h1>
        <p className="text-sm text-muted-foreground">Valuación actual del inventario a precio unitario</p>
      </div>

      <div className="flex gap-2">
        <Button onClick={loadReport} disabled={loading}>
          {loading ? 'Cargando…' : 'Cargar'}
        </Button>
        <Button variant="outline" onClick={handleExport} disabled={data.length === 0}>
          <Download className="h-4 w-4 mr-1" />
          CSV
        </Button>
      </div>

      {data.length > 0 && (
        <div className="space-y-3">
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.product_id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.stock}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.price ? formatCurrency(row.price, DEFAULT_CURRENCY) : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(row.value, DEFAULT_CURRENCY)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-bold bg-muted/50">
                  <TableCell colSpan={3}>VALOR TOTAL DEL INVENTARIO</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(total, DEFAULT_CURRENCY)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Incluye solo productos con valor calculable (stock × precio)
          </p>
        </div>
      )}

      {data.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-6">
          Carga el reporte para ver la valuación
        </p>
      )}
    </div>
  )
}
