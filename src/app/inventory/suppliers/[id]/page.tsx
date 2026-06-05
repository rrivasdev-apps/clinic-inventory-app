import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Pencil, Plus, Phone, Mail, MapPin, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { updateOrderStatus } from '@/features/suppliers/actions'
import {
  getSupplier,
  getSupplierPurchaseHistory,
  getSupplierOrders,
} from '@/features/suppliers/queries'
import { cn } from '@/lib/utils'

const ORDER_STATUS_CLASS: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-700 border-gray-200',
  sent:      'bg-blue-100 text-blue-700 border-blue-200',
  received:  'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}
const ORDER_STATUS_LABEL: Record<string, string> = {
  draft:     'Borrador',
  sent:      'Enviada',
  received:  'Recibida',
  cancelled: 'Cancelada',
}

interface Props { params: Promise<{ id: string }> }

export default async function SupplierDetailPage({ params }: Props) {
  const { id } = await params
  const [supplier, history, orders] = await Promise.all([
    getSupplier(id),
    getSupplierPurchaseHistory(id),
    getSupplierOrders(id),
  ])

  if (!supplier) notFound()

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{supplier.name}</h1>
          {supplier.contact_name && (
            <p className="text-sm text-muted-foreground">{supplier.contact_name}</p>
          )}
        </div>
        <Button variant="outline" size="sm" render={<Link href={`/inventory/suppliers/${id}/edit`} />}>
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Editar
        </Button>
      </div>

      {/* Contact info */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {supplier.phone && (
          <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{supplier.phone}</span>
        )}
        {supplier.email && (
          <a href={`mailto:${supplier.email}`} className="flex items-center gap-1.5 hover:text-foreground">
            <Mail className="h-3.5 w-3.5" />{supplier.email}
          </a>
        )}
        {supplier.address && (
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{supplier.address}</span>
        )}
      </div>

      {/* Purchase orders */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Órdenes de compra</h2>
          <Button size="sm" render={<Link href={`/inventory/suppliers/${id}/orders/new`} />}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva orden
          </Button>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">Aún no hay órdenes de compra para este proveedor.</p>
        ) : (
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-40" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const items = Array.isArray(order.items_json) ? order.items_json : []
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(order.created_at), 'd MMM yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="text-sm">{(items as unknown[]).length} productos</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs', ORDER_STATUS_CLASS[order.status])}>
                          {ORDER_STATUS_LABEL[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            render={<Link href={`/inventory/suppliers/${id}/orders/${order.id}/print`} />}
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            Ver
                          </Button>
                          {order.status === 'draft' && (
                            <form action={updateOrderStatus.bind(null, order.id, 'sent')}>
                              <Button type="submit" variant="outline" size="sm">Marcar enviada</Button>
                            </form>
                          )}
                          {order.status === 'sent' && (
                            <form action={updateOrderStatus.bind(null, order.id, 'received')}>
                              <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                Recibida ✓
                              </Button>
                            </form>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Purchase history */}
      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Historial de compras</h2>
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="hidden md:table-cell">Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(m.created_at), 'd MMM, HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell className="text-sm">{m.product?.name ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-green-700 font-medium">
                      +{m.quantity} {m.product?.unit}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {m.notes ?? '—'}
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
