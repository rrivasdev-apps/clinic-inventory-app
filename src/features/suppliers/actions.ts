'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supplierSchema, purchaseOrderSchema, type PurchaseOrderItem } from './validation'

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

export async function createSupplier(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const parsed = supplierSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const v = parsed.data
  const { error } = await supabase.from('suppliers').insert({
    name:         v.name,
    contact_name: v.contact_name || null,
    phone:        v.phone        || null,
    email:        v.email        || null,
    address:      v.address      || null,
    notes:        v.notes        || null,
    created_by:   user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/inventory/suppliers')
  redirect('/inventory/suppliers')
}

export async function updateSupplier(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  const parsed = supplierSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const v = parsed.data
  const { error } = await supabase.from('suppliers').update({
    name:         v.name,
    contact_name: v.contact_name || null,
    phone:        v.phone        || null,
    email:        v.email        || null,
    address:      v.address      || null,
    notes:        v.notes        || null,
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/inventory/suppliers')
  redirect(`/inventory/suppliers/${id}`)
}

export async function deactivateSupplier(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/inventory/suppliers')
  redirect('/inventory/suppliers')
}

// ---------------------------------------------------------------------------
// Purchase orders
// ---------------------------------------------------------------------------

export async function createPurchaseOrder(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const supplierId = formData.get('supplier_id') as string
  const parsed     = purchaseOrderSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  let items: PurchaseOrderItem[]
  try {
    items = JSON.parse(parsed.data.items_json)
  } catch {
    return { error: 'Lista de productos inválida' }
  }

  if (!items.length) return { error: 'Agrega al menos un producto' }

  const { data: order, error } = await supabase
    .from('purchase_orders')
    .insert({
      supplier_id: supplierId,
      status:      'draft',
      items_json:  items as unknown as import('@/types').Json,
      notes:       parsed.data.notes || null,
      created_by:  user.id,
    })
    .select('id')
    .single()

  if (error || !order) return { error: error?.message ?? 'Error al crear la orden' }

  revalidatePath(`/inventory/suppliers/${supplierId}`)
  redirect(`/inventory/suppliers/${supplierId}/orders/${order.id}/print`)
}

export async function updateOrderStatus(orderId: string, status: 'sent' | 'received' | 'cancelled') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // Fetch the order to get items and supplier
  const { data: order } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Orden no encontrada')

  const { error } = await supabase
    .from('purchase_orders')
    .update({ status })
    .eq('id', orderId)

  if (error) throw new Error(error.message)

  // When received: auto-create a 'purchase' movement for each item
  if (status === 'received') {
    const items = order.items_json as unknown as PurchaseOrderItem[]
    const movements = items.map((item) => ({
      product_id:  item.product_id,
      type:        'purchase' as const,
      quantity:    item.quantity,     // positive = stock in
      user_id:     user.id,
      created_by:  user.id,
      notes:       `Orden de compra #${orderId.slice(0, 8)}`,
      sync_status: 'synced' as const,
    }))

    await supabase.from('movements').insert(movements)
  }

  revalidatePath(`/inventory/suppliers/${order.supplier_id}`)
  revalidatePath('/inventory/products')
  revalidatePath('/inventory/dashboard')
}
