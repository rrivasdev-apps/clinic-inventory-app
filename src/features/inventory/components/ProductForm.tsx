'use client'

import { useState, useActionState } from 'react'
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
import { createProduct, updateProduct } from '../actions'
import type { Category, Supplier, Product } from '@/types'

const UNITS = ['unidad', 'caja', 'ampolla', 'ml', 'mg', 'g', 'l', 'par', 'kit', 'rollo']

interface Props {
  categories: Category[]
  suppliers: Pick<Supplier, 'id' | 'name'>[]
  product?: Product   // when present, form is in edit mode
}

export default function ProductForm({ categories, suppliers, product }: Props) {
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '')
  const [supplierId, setSupplierId] = useState(product?.supplier_id ?? '')
  const [price, setPrice] = useState(product?.price?.toString() ?? '')

  const action = product ? updateProduct : createProduct
  const [state, formAction, pending] = useActionState(action, undefined)

  const selectedCategory = categoryId ? categories.find(c => c.id === categoryId) : null
  const selectedSupplier = supplierId ? suppliers.find(s => s.id === supplierId) : null

  const handleCategoryChange = (value: string | null) => {
    setCategoryId(value ?? '')
  }

  const handleSupplierChange = (value: string | null) => {
    setSupplierId(value ?? '')
  }

  return (
    <form action={formAction} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="supplier_id" value={supplierId} />
      <input type="hidden" name="price" value={price} />

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Name */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={product?.name}
            placeholder="Ej. Guantes estériles talla M"
            required
          />
        </div>

        {/* Code */}
        <div className="space-y-2">
          <Label htmlFor="code">Código / SKU</Label>
          <Input
            id="code"
            name="code"
            defaultValue={product?.code ?? ''}
            placeholder="Ej. GE-M-100"
          />
        </div>

        {/* Unit */}
        <div className="space-y-2">
          <Label htmlFor="unit">Unidad de medida *</Label>
          <Select name="unit" defaultValue={product?.unit ?? 'unidad'}>
            <SelectTrigger id="unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stock current */}
        <div className="space-y-2">
          <Label htmlFor="stock_current">Stock actual *</Label>
          <Input
            id="stock_current"
            name="stock_current"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product?.stock_current ?? 0}
            disabled={!!product}  // stock is managed through movements, not direct edit
          />
          {product && (
            <p className="text-xs text-muted-foreground">
              Ajusta el stock registrando un movimiento de ajuste.
            </p>
          )}
        </div>

        {/* Stock minimum */}
        <div className="space-y-2">
          <Label htmlFor="stock_minimum">Stock mínimo *</Label>
          <Input
            id="stock_minimum"
            name="stock_minimum"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product?.stock_minimum ?? 0}
          />
        </div>

        {/* Stock maximum */}
        <div className="space-y-2">
          <Label htmlFor="stock_maximum">Stock máximo</Label>
          <Input
            id="stock_maximum"
            name="stock_maximum"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product?.stock_maximum ?? ''}
            placeholder="Opcional"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category_id">Categoría</Label>
          <Select value={categoryId} onValueChange={handleCategoryChange}>
            <SelectTrigger id="category_id">
              <SelectValue placeholder="Sin categoría">
                {selectedCategory?.name ?? 'Sin categoría'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin categoría</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Supplier */}
        <div className="space-y-2">
          <Label htmlFor="supplier_id">Proveedor</Label>
          <Select value={supplierId} onValueChange={handleSupplierChange}>
            <SelectTrigger id="supplier_id">
              <SelectValue placeholder="Sin proveedor">
                {selectedSupplier?.name ?? 'Sin proveedor'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin proveedor</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Ubicación</Label>
          <Input
            id="location"
            name="location"
            defaultValue={product?.location ?? ''}
            placeholder="Ej. Armario 3 — Cajón B"
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Precio unitario</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Opcional"
          />
        </div>

        {/* Expiry date */}
        <div className="space-y-2">
          <Label htmlFor="expiry_date">Fecha de vencimiento</Label>
          <Input
            id="expiry_date"
            name="expiry_date"
            type="date"
            defaultValue={product?.expiry_date ?? ''}
          />
        </div>

        {/* Description */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={product?.description ?? ''}
            placeholder="Notas adicionales sobre el producto…"
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending} className="flex-1 sm:flex-none">
          {pending ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
