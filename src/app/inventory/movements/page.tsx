import Link from 'next/link'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getMovements } from '@/features/movements/queries'
import { MOVEMENT_TYPE_LABELS } from '@/features/movements/validation'
import { cn } from '@/lib/utils'

const TYPE_BADGE_CLASS: Record<string, string> = {
  purchase:   'bg-green-100 text-green-800 border-green-200',
  return:     'bg-blue-100 text-blue-800 border-blue-200',
  usage:      'bg-orange-100 text-orange-800 border-orange-200',
  expiry:     'bg-red-100 text-red-800 border-red-200',
  loss:       'bg-red-100 text-red-800 border-red-200',
  adjustment: 'bg-purple-100 text-purple-800 border-purple-200',
}

export default async function MovementsPage() {
  const movements = await getMovements(100)

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Movimientos</h1>
          <p className="text-sm text-muted-foreground">
            Últimos {movements.length} registros
          </p>
        </div>
        <Button size="sm" render={<Link href="/inventory/movements/new" />}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="hidden md:table-cell">Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Aún no hay movimientos registrados
                </TableCell>
              </TableRow>
            ) : (
              movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    <p>{format(new Date(m.created_at), 'd MMM', { locale: es })}</p>
                    <p>{format(new Date(m.created_at), 'HH:mm')}</p>
                  </TableCell>

                  <TableCell>
                    <p className="text-sm font-medium">{m.product?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{m.product?.unit}</p>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className={cn('text-xs', TYPE_BADGE_CLASS[m.type])}>
                      {MOVEMENT_TYPE_LABELS[m.type]}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <span className={cn(
                      'font-semibold tabular-nums text-sm',
                      m.quantity > 0 ? 'text-green-700' : 'text-red-600'
                    )}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </span>
                  </TableCell>

                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-xs truncate">
                    {m.notes ?? '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
