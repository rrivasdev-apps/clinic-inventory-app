'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getMovementExportData } from '@/features/reports/queries'
import { exportMovementsCSV } from '@/features/reports/actions'

export default function MovementsExportPage() {
  const [days, setDays] = useState(90)
  const [data, setData] = useState<Awaited<ReturnType<typeof getMovementExportData>>>([])
  const [loading, setLoading] = useState(false)

  async function loadReport() {
    setLoading(true)
    const result = await getMovementExportData(days)
    setData(result)
    setLoading(false)
  }

  async function handleExport() {
    const csv = await exportMovementsCSV(days)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `movimientos-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">Exportar Movimientos</h1>
        <p className="text-sm text-muted-foreground">Descarga todos los movimientos en CSV</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-2">
          <label className="text-xs text-muted-foreground">Últimos N días</label>
          <Select value={days.toString()} onValueChange={(v) => v && setDays(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 días</SelectItem>
              <SelectItem value="30">30 días</SelectItem>
              <SelectItem value="90">90 días</SelectItem>
              <SelectItem value="180">180 días</SelectItem>
              <SelectItem value="365">1 año</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-5">
          <Button onClick={loadReport} disabled={loading}>
            {loading ? 'Cargando…' : 'Cargar'}
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={data.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            CSV ({data.length})
          </Button>
        </div>
      </div>

      {data.length > 0 && (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="hidden sm:table-cell">Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm text-muted-foreground">{row.date}</TableCell>
                  <TableCell className="text-sm">{row.product}</TableCell>
                  <TableCell className="text-xs capitalize">{row.type}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.quantity}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.unit}</TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                    {row.notes ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-6">
          Carga los movimientos para verlos
        </p>
      )}
    </div>
  )
}
