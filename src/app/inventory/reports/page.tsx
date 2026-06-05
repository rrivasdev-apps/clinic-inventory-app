import Link from 'next/link'
import { BarChart3, TrendingDown, Download } from 'lucide-react'

const reports = [
  {
    href:        '/inventory/reports/consumption',
    icon:        TrendingDown,
    title:       'Consumo de Materiales',
    description: 'Análisis de entradas y salidas por día, semana o mes',
  },
  {
    href:        '/inventory/reports/stock-value',
    icon:        BarChart3,
    title:       'Valor del Inventario',
    description: 'Valuación actual del inventario a precio unitario',
  },
  {
    href:        '/inventory/reports/movements',
    icon:        Download,
    title:       'Exportar Movimientos',
    description: 'Descarga de todos los movimientos en CSV o PDF',
  },
]

export default function ReportsPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground">Análisis y exportación de datos del inventario</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {reports.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border bg-card p-4 hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="flex gap-3">
              <div className="rounded-lg bg-primary/10 p-2 h-fit">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
