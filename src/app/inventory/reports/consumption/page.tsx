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
import { getConsumptionReport, type ConsumptionPeriod } from '@/features/reports/queries'
import { exportConsumptionCSV } from '@/features/reports/actions'

export default function ConsumptionReportPage() {
  const [period, setPeriod] = useState<ConsumptionPeriod>('daily')
  const [days, setDays] = useState(30)
  const [data, setData] = useState<Awaited<ReturnType<typeof getConsumptionReport>>>([])
  const [loading, setLoading] = useState(false)

  async function loadReport() {
    setLoading(true)
    const result = await getConsumptionReport(period, days)
    setData(result)
    setLoading(false)
  }

  async function handleExport() {
    const csv = await exportConsumptionCSV(period, days)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `consumo-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">Consumo de Materiales</h1>
        <p className="text-sm text-muted-foreground">Análisis de entradas y salidas del inventario</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-2">
          <label className="text-xs text-muted-foreground">Período</label>
          <Select value={period} onValueChange={(v) => setPeriod(v as ConsumptionPeriod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diario</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-5">
          <Button onClick={loadReport} disabled={loading}>
            {loading ? 'Cargando…' : 'Cargar'}
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={data.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      {data.length > 0 && (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Entradas</TableHead>
                <TableHead className="text-right">Salidas</TableHead>
                <TableHead className="text-right">Cambio Neto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.period}</TableCell>
                  <TableCell className="text-right tabular-nums text-green-700 font-medium">
                    +{row.totalEntry.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-orange-700 font-medium">
                    −{row.totalExit.toFixed(2)}
                  </TableCell>
                  <TableCell className={`text-right tabular-nums font-medium ${
                    row.netChange >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {row.netChange >= 0 ? '+' : '−'}{Math.abs(row.netChange).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-6">
          Carga un reporte para ver los datos
        </p>
      )}
    </div>
  )
}
