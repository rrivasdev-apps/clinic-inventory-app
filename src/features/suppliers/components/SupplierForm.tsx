'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createSupplier, updateSupplier } from '../actions'
import type { Supplier } from '@/types'

interface Props {
  supplier?: Supplier
}

export default function SupplierForm({ supplier }: Props) {
  const action = supplier ? updateSupplier : createSupplier
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="space-y-5">
      {supplier && <input type="hidden" name="id" value={supplier.id} />}

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Nombre del proveedor *</Label>
          <Input id="name" name="name" defaultValue={supplier?.name} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_name">Persona de contacto</Label>
          <Input id="contact_name" name="contact_name" defaultValue={supplier?.contact_name ?? ''} placeholder="Ej. Juan Pérez" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={supplier?.phone ?? ''} placeholder="+506 8888-7777" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" name="email" type="email" defaultValue={supplier?.email ?? ''} placeholder="ventas@proveedor.com" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" name="address" defaultValue={supplier?.address ?? ''} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea id="notes" name="notes" defaultValue={supplier?.notes ?? ''} rows={2} placeholder="Condiciones, tiempo de entrega, etc." />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : supplier ? 'Guardar cambios' : 'Crear proveedor'}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
