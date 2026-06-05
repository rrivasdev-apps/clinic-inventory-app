'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { movementSchema, ENTRY_TYPES } from './validation'
import type { MovementType } from '@/types'

// Signed quantity: positive = stock in, negative = stock out
function toSignedQuantity(type: MovementType, quantity: number, sign: '+' | '-'): number {
  if (type === 'adjustment') return sign === '+' ? quantity : -quantity
  return ENTRY_TYPES.includes(type as typeof ENTRY_TYPES[number]) ? quantity : -quantity
}

export async function createMovement(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const raw = Object.fromEntries(formData)
  const parsed = movementSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { type, quantity, sign, notes, procedure_id, product_id } = parsed.data

  const signedQty = toSignedQuantity(type, quantity, sign)

  const { error } = await supabase.from('movements').insert({
    product_id:   product_id,
    type:         type,
    quantity:     signedQty,
    user_id:      user.id,
    created_by:   user.id,
    procedure_id: procedure_id || null,
    notes:        notes || null,
    sync_status:  'synced',
  })

  if (error) return { error: error.message }

  revalidatePath('/inventory/movements')
  revalidatePath('/inventory/products')
  revalidatePath('/inventory/dashboard')
  redirect('/inventory/movements')
}
