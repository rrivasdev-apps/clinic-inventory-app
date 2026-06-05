import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getPurchaseOrder } from '@/features/suppliers/queries'
import type { PurchaseOrderItem } from '@/features/suppliers/validation'
import { createClient } from '@/lib/supabase/server'
import { getAppCurrency } from '@/lib/currency'
import { formatCurrency } from '@/lib/currency-utils'
import PrintControls from './print-controls'

interface Props { params: Promise<{ id: string; orderId: string }> }

export default async function PrintOrderPage({ params }: Props) {
  const { orderId } = await params
  const order = await getPurchaseOrder(orderId)
  if (!order) notFound()

  const supabase = await createClient()
  const { data: settings } = await supabase.from('settings').select('clinic_name').single()
  const currency = await getAppCurrency()

  const items = (order.items_json ?? []) as unknown as PurchaseOrderItem[]
  const total = items.reduce((sum, i) => sum + i.quantity * (i.unit_price ?? 0), 0)

  return (
    <>
      <PrintControls />

      {/* Printable order */}
      <div className="p-8 max-w-2xl mx-auto font-sans text-sm print:p-0 print:max-w-none">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{settings?.clinic_name ?? 'Clínica'}</h1>
            <p className="text-muted-foreground">Orden de compra</p>
          </div>
          <div className="text-right text-muted-foreground">
            <p className="font-mono text-xs">#{orderId.slice(0, 8).toUpperCase()}</p>
            <p>{format(new Date(order.created_at), "d 'de' MMMM yyyy", { locale: es })}</p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Proveedor</p>
          <p className="font-semibold">{order.supplier?.name ?? '—'}</p>
        </div>

        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-foreground/20">
              <th className="text-left py-2 font-semibold">Producto</th>
              <th className="text-center py-2 font-semibold w-20">Unidad</th>
              <th className="text-center py-2 font-semibold w-24">Cantidad</th>
              <th className="text-right py-2 font-semibold w-28">P. Unitario</th>
              <th className="text-right py-2 font-semibold w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-foreground/10">
                <td className="py-2">{item.product_name}</td>
                <td className="py-2 text-center text-muted-foreground">{item.unit}</td>
                <td className="py-2 text-center tabular-nums">{item.quantity}</td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">
                  {item.unit_price
                    ? formatCurrency(item.unit_price, currency)
                    : '—'}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {item.unit_price
                    ? formatCurrency(item.quantity * item.unit_price, currency)
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          {total > 0 && (
            <tfoot>
              <tr className="border-t-2 border-foreground/20">
                <td colSpan={4} className="py-2 text-right font-semibold">Total estimado:</td>
                <td className="py-2 text-right font-bold tabular-nums">
                  {formatCurrency(total, currency)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>

        {order.notes && (
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <p className="text-xs text-muted-foreground mb-1">Notas:</p>
            <p>{order.notes}</p>
          </div>
        )}

        <p className="mt-8 text-xs text-muted-foreground text-center print:mt-12">
          Generado por el sistema de inventario — {format(new Date(), "d MMM yyyy, HH:mm", { locale: es })}
        </p>
      </div>
    </>
  )
}
