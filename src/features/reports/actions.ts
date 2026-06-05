'use server'

import { getConsumptionReport, getStockValueReport, getMovementExportData } from './queries'
import type { ConsumptionPeriod } from './queries'

export async function exportConsumptionCSV(period: ConsumptionPeriod, days: number) {
  const data = await getConsumptionReport(period, days)

  const header = ['Período', 'Entradas', 'Salidas', 'Cambio Neto']
  const rows = data.map((row) => [
    row.period,
    row.totalEntry.toString(),
    row.totalExit.toString(),
    row.netChange.toString(),
  ])

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n')

  return Buffer.from(csv, 'utf-8')
}

export async function exportStockValueCSV() {
  const data = await getStockValueReport()

  const header = ['Producto', 'Stock', 'Precio Unit.', 'Valor Total']
  const rows = data.map((row) => [
    row.name,
    row.stock.toString(),
    row.price?.toString() ?? '—',
    row.value.toFixed(2),
  ])

  const total = data.reduce((sum, r) => sum + r.value, 0)
  rows.push(['TOTAL', '', '', total.toFixed(2)])

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n')

  return Buffer.from(csv, 'utf-8')
}

export async function exportMovementsCSV(days: number) {
  const data = await getMovementExportData(days)

  const header = ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Unidad', 'Notas']
  const rows = data.map((row) => [
    row.date,
    row.product,
    row.type,
    row.quantity.toString(),
    row.unit,
    row.notes ?? '',
  ])

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n')

  return Buffer.from(csv, 'utf-8')
}
