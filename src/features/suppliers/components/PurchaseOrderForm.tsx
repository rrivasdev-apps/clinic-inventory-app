'use client'

import { useState, useActionState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPurchaseOrder } from '../actions'
import { formatCurrency } from '@/lib/currency-utils'
import type { PurchaseOrderItem } from '../validation'

interface SimpleProduct {
  id:    string
  name:  string
  unit:  string
  price: number | null
}

interface Props {
  supplierId: string
  products:   SimpleProduct[]
  currency:   string
}

export default function PurchaseOrderForm({ supplierId, products, currency }: Props) {
  const [state, formAction, pending] = useActionState(createPurchaseOrder, undefined)
  const [items, setItems]            = useState<PurchaseOrderItem[]>([])
  const [selected, setSelected]      = useState<SimpleProduct | null>(null)

  function addItem(product: SimpleProduct | null) {
    if (!product) return
    if (items.find((i) => i.product_id === product.id)) {
      setSelected(null)
      return
    }
    setItems((prev) => [
      ...prev,
      {
        product_id:   product.id,
        product_name: product.name,
        unit:         product.unit,
        quantity:     1,
        unit_price:   product.price ?? null,
      },
    ])
    setSelected(null)
  }

  function updateQty(productId: string, qty: number) {
    setItems((prev) =>
      prev.map((i) => i.product_id === productId ? { ...i, quantity: Math.max(1, qty) } : i)
    )
  }

  function updatePrice(productId: string, price: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? { ...i, unit_price: price ? parseFloat(price) : null }
          : i
      )
    )
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }

  const total = items.reduce(
    (sum, i) => sum + i.quantity * (i.unit_price ?? 0),
    0
  )

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="supplier_id" value={supplierId} />
      <input type="hidden" name="items_json"  value={JSON.stringify(items)} />

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {/* Product select */}
      <div className="space-y-2">
        <Label>Agregar producto</Label>
        <div className="flex gap-2">
          <Select value={selected?.id ?? ''} onValueChange={(id) => {
            const product = products.find(p => p.id === id)
            setSelected(product ?? null)
          }}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Buscar producto...">
                {selected ? `${selected.name} (${selected.unit})` : ''}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={() => addItem(selected)}
            disabled={!selected}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Line items */}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6 border rounded-lg border-dashed">
          Busca y agrega productos a la orden
        </p>
      ) : (
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-[1fr_100px_120px_40px] gap-2 px-3 text-xs text-muted-foreground">
            <span>Producto</span>
            <span className="text-center">Cantidad</span>
            <span className="text-center">Precio unit.</span>
            <span />
          </div>

          {items.map((item) => (
            <div
              key={item.product_id}
              className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_100px_120px_40px] gap-2 items-center rounded-lg border px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{item.product_name}</p>
                <p className="text-xs text-muted-foreground">{item.unit}</p>
              </div>

              <Input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateQty(item.product_id, parseInt(e.target.value) || 1)}
                className="w-20 text-center"
              />

              <Input
                type="number"
                min={0}
                step="0.01"
                value={item.unit_price ?? ''}
                onChange={(e) => updatePrice(item.product_id, e.target.value)}
                placeholder="—"
                className="w-28 text-right"
              />

              <button
                type="button"
                onClick={() => removeItem(item.product_id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {total > 0 && (
            <div className="flex justify-end pt-1">
              <p className="text-sm font-semibold">
                Total estimado:&nbsp;
                {formatCurrency(total, currency)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas para el proveedor (opcional)</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Instrucciones de entrega, urgencia, etc." />
      </div>

      <Button type="submit" disabled={pending || items.length === 0} className="w-full sm:w-auto">
        {pending ? 'Creando orden…' : `Crear orden (${items.length} productos)`}
      </Button>
    </form>
  )
}
