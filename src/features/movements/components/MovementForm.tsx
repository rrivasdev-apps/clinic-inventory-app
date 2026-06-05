'use client'

import { useState, useActionState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Minus, Plus, QrCode, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import StockStatusBadge from '@/components/stock-status-badge'
import QrScanner from '@/components/QrScanner'
import ProductCombobox from './ProductCombobox'
import { createMovement } from '../actions'
import { savePendingMovement } from '@/lib/offline-movements'
import {
  ENTRY_TYPES,
  EXIT_TYPES,
  ADJUSTMENT_TYPES,
  MOVEMENT_TYPE_LABELS,
} from '../validation'
import type { ProductWithRelations } from '@/features/inventory/queries'
import type { MovementType } from '@/types'

interface Props {
  products: ProductWithRelations[]
}

const TYPE_COLORS: Record<string, string> = {
  usage:      'border-orange-300 bg-orange-50 text-orange-800 data-[selected=true]:bg-orange-500 data-[selected=true]:text-white data-[selected=true]:border-orange-500',
  expiry:     'border-red-300   bg-red-50   text-red-800   data-[selected=true]:bg-red-500   data-[selected=true]:text-white data-[selected=true]:border-red-500',
  loss:       'border-red-300   bg-red-50   text-red-800   data-[selected=true]:bg-red-500   data-[selected=true]:text-white data-[selected=true]:border-red-500',
  adjustment: 'border-purple-300 bg-purple-50 text-purple-800 data-[selected=true]:bg-purple-500 data-[selected=true]:text-white data-[selected=true]:border-purple-500',
  purchase:   'border-green-300 bg-green-50 text-green-800 data-[selected=true]:bg-green-500 data-[selected=true]:text-white data-[selected=true]:border-green-500',
  return:     'border-blue-300  bg-blue-50  text-blue-800  data-[selected=true]:bg-blue-500  data-[selected=true]:text-white data-[selected=true]:border-blue-500',
}

export default function MovementForm({ products }: Props) {
  const searchParams = useSearchParams()
  const [state, formAction, pending] = useActionState(createMovement, undefined)

  const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null)
  const [mode, setMode]         = useState<'exit' | 'entry'>('exit')
  const [type, setType]         = useState<MovementType>('usage')
  const [quantity, setQuantity] = useState(1)
  const [sign, setSign]         = useState<'+' | '-'>('-')
  const [showNotes, setShowNotes] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [savedOffline, setSavedOffline] = useState(false)

  // Pre-select product from URL param (e.g. ?product=CODE after QR scan)
  useEffect(() => {
    const code = searchParams.get('product')
    if (code && products.length) {
      const found = products.find(
        (p) => p.code === code || p.id === code
      )
      if (found) setSelectedProduct(found)
    }
  }, [searchParams, products])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  function handleModeChange(newMode: 'exit' | 'entry') {
    setMode(newMode)
    setType(newMode === 'exit' ? 'usage' : 'purchase')
    setSign(newMode === 'exit' ? '-' : '+')
  }

  function handleQrScan(code: string) {
    setShowScanner(false)
    const found = products.find((p) => p.code === code || p.id === code)
    if (found) setSelectedProduct(found)
  }

  async function handleOfflineSave() {
    if (!selectedProduct) return
    const signedQty = type === 'adjustment'
      ? (sign === '+' ? quantity : -quantity)
      : mode === 'exit' ? -quantity : quantity

    const notesEl = document.querySelector<HTMLTextAreaElement>('[name="notes"]')
    await savePendingMovement({
      product_id:   selectedProduct.id,
      type,
      quantity:     signedQty,
      notes:        notesEl?.value || null,
      procedure_id: null,
    })
    setSavedOffline(true)
  }

  const isExit = mode === 'exit'

  const displayDelta = type === 'adjustment'
    ? `${sign}${quantity}`
    : isExit ? `-${quantity}` : `+${quantity}`

  const stockAfter = selectedProduct
    ? type === 'adjustment'
      ? selectedProduct.stock_current + (sign === '+' ? quantity : -quantity)
      : isExit
        ? selectedProduct.stock_current - quantity
        : selectedProduct.stock_current + quantity
    : null

  if (savedOffline) {
    return (
      <div className="text-center space-y-3 py-8">
        <WifiOff className="h-8 w-8 mx-auto text-orange-500" />
        <p className="font-semibold">Movimiento guardado sin conexión</p>
        <p className="text-sm text-muted-foreground">
          Se sincronizará automáticamente cuando haya conexión.
        </p>
        <Button variant="outline" onClick={() => { setSavedOffline(false); setSelectedProduct(null); setQuantity(1) }}>
          Registrar otro
        </Button>
      </div>
    )
  }

  return (
    <>
      {showScanner && (
        <QrScanner onScan={handleQrScan} onClose={() => setShowScanner(false)} />
      )}

      <form action={isOnline ? formAction : undefined} className="space-y-6">
        <input type="hidden" name="product_id" value={selectedProduct?.id ?? ''} />
        <input type="hidden" name="type"       value={type} />
        <input type="hidden" name="quantity"   value={quantity} />
        <input type="hidden" name="sign"       value={sign} />

        {!isOnline && (
          <div className="flex items-center gap-2 rounded-md bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-800">
            <WifiOff className="h-4 w-4 shrink-0" />
            Sin conexión — el movimiento se guardará localmente y se sincronizará al reconectar.
          </div>
        )}

        {state?.error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        {/* Product search + QR button */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Producto *</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <ProductCombobox
                products={products}
                value={selectedProduct?.id ?? ''}
                onChange={setSelectedProduct}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowScanner(true)}
              title="Escanear código QR"
              className="shrink-0"
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </div>

          {selectedProduct && (
            <div className="rounded-lg border bg-muted/50 p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{selectedProduct.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stock:&nbsp;
                  <span className="font-semibold tabular-nums">{selectedProduct.stock_current}</span>
                  &nbsp;{selectedProduct.unit}
                </p>
              </div>
              <StockStatusBadge
                stockCurrent={selectedProduct.stock_current}
                stockMinimum={selectedProduct.stock_minimum}
              />
            </div>
          )}
        </div>

        {/* Mode + type */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Tipo de movimiento *</Label>
          <div className="grid grid-cols-2 gap-2 rounded-lg border p-1 bg-muted">
            {(['exit', 'entry'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                className={cn(
                  'rounded-md py-2 text-sm font-medium transition-all',
                  mode === m ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {m === 'exit' ? '↓ Salida' : '↑ Entrada'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(isExit ? [...EXIT_TYPES, ...ADJUSTMENT_TYPES] : ENTRY_TYPES).map((t) => (
              <button
                key={t}
                type="button"
                data-selected={type === t}
                onClick={() => { setType(t); if (t === 'adjustment') setSign('-') }}
                className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-all', TYPE_COLORS[t])}
              >
                {MOVEMENT_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Cantidad *</Label>

          {type === 'adjustment' && (
            <div className="flex gap-2 mb-2">
              {(['+', '-'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSign(s)}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-sm font-bold transition-all',
                    sign === s
                      ? s === '+' ? 'bg-green-500 text-white border-green-500' : 'bg-red-500 text-white border-red-500'
                      : 'bg-background text-muted-foreground'
                  )}
                >
                  {s === '+' ? '+ Agregar' : '− Quitar'}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-12 w-12 shrink-0 rounded-xl border bg-background text-lg font-bold active:scale-95 transition-transform flex items-center justify-center"
            >
              <Minus className="h-5 w-5" />
            </button>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0.01, parseFloat(e.target.value) || 0))}
              className="h-12 text-center text-xl font-bold tabular-nums"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="h-12 w-12 shrink-0 rounded-xl border bg-background text-lg font-bold active:scale-95 transition-transform flex items-center justify-center"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {selectedProduct && stockAfter !== null && (
            <p className="text-xs text-muted-foreground text-center">
              {selectedProduct.stock_current} →{' '}
              <span className={cn(
                'font-semibold',
                stockAfter < 0 ? 'text-destructive' : stockAfter <= selectedProduct.stock_minimum ? 'text-orange-600' : 'text-green-700'
              )}>
                {stockAfter}
              </span>
              {' '}{selectedProduct.unit}
              {stockAfter < 0 && ' ⚠ Stock negativo'}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showNotes ? '▾' : '▸'} Notas (opcional)
          </button>
          {showNotes && (
            <Textarea name="notes" placeholder="Observaciones, número de lote, motivo…" rows={2} />
          )}
        </div>

        {/* Submit */}
        {isOnline ? (
          <Button
            type="submit"
            disabled={pending || !selectedProduct}
            className={cn(
              'w-full h-12 text-base font-semibold',
              isExit ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
            )}
          >
            {pending
              ? 'Registrando…'
              : `Registrar ${isExit ? 'salida' : 'entrada'} ${selectedProduct ? `(${displayDelta} ${selectedProduct.unit})` : ''}`}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!selectedProduct}
            onClick={handleOfflineSave}
            className="w-full h-12 text-base font-semibold bg-orange-600 hover:bg-orange-700 text-white"
          >
            <WifiOff className="h-4 w-4 mr-2" />
            Guardar sin conexión
          </Button>
        )}
      </form>
    </>
  )
}
