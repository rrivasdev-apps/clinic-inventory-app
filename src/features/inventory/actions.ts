'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { productSchema, productUpdateSchema, categorySchema } from './validation'

const uuidSchema = z.string().uuid()

// ---------------------------------------------------------------------------
// Role helper — verifies caller has one of the allowed roles
// ---------------------------------------------------------------------------
async function requireRole(supabase: Awaited<ReturnType<typeof createClient>>, ...roles: string[]) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('module', 'inventory')
    .single()

  if (!roleRow || !roles.includes(roleRow.role)) return null
  return user
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function createProduct(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const user = await requireRole(supabase, 'admin', 'purchasing')
  if (!user) return { error: 'No autorizado' }

  const raw = Object.fromEntries(formData)
  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const values = parsed.data
  const { error } = await supabase.from('products').insert({
    name:          values.name,
    code:          values.code || null,
    category_id:   values.category_id || null,
    unit:          values.unit,
    stock_current: values.stock_current,
    stock_minimum: values.stock_minimum,
    stock_maximum: values.stock_maximum ?? null,
    location:      values.location || null,
    supplier_id:   values.supplier_id || null,
    price:         values.price ?? null,
    expiry_date:   values.expiry_date || null,
    description:   values.description || null,
    created_by:    user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/inventory/products')
  redirect('/inventory/products')
}

export async function updateProduct(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const user = await requireRole(supabase, 'admin', 'purchasing')
  if (!user) return { error: 'No autorizado' }

  const id = formData.get('id') as string
  if (!uuidSchema.safeParse(id).success) return { error: 'ID inválido' }

  const raw = Object.fromEntries(formData)
  const parsed = productUpdateSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const values = parsed.data
  const { error } = await supabase.from('products').update({
    name:          values.name,
    code:          values.code || null,
    category_id:   values.category_id || null,
    unit:          values.unit,
    stock_minimum: values.stock_minimum,
    stock_maximum: values.stock_maximum ?? null,
    location:      values.location || null,
    supplier_id:   values.supplier_id || null,
    price:         values.price ?? null,
    expiry_date:   values.expiry_date || null,
    description:   values.description || null,
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/inventory/products')
  redirect('/inventory/products')
}

export async function deactivateProduct(id: string) {
  if (!uuidSchema.safeParse(id).success) throw new Error('ID inválido')

  const supabase = await createClient()
  const user = await requireRole(supabase, 'admin', 'purchasing')
  if (!user) throw new Error('No autorizado')

  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/inventory/products')
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function createCategory(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const user = await requireRole(supabase, 'admin')
  if (!user) return { error: 'No autorizado' }

  const raw = Object.fromEntries(formData)
  const parsed = categorySchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('categories').insert({
    name:        parsed.data.name,
    color:       parsed.data.color,
    description: parsed.data.description || null,
    created_by:  user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/inventory/products')
  return { success: true }
}

export async function updateCategory(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const user = await requireRole(supabase, 'admin')
  if (!user) return { error: 'No autorizado' }

  const id = formData.get('id') as string
  if (!uuidSchema.safeParse(id).success) return { error: 'ID inválido' }

  const raw = Object.fromEntries(formData)
  const parsed = categorySchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('categories').update({
    name:        parsed.data.name,
    color:       parsed.data.color,
    description: parsed.data.description || null,
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/inventory/products')
  return { success: true }
}

export async function deleteCategory(id: string) {
  if (!uuidSchema.safeParse(id).success) throw new Error('ID inválido')

  const supabase = await createClient()
  const user = await requireRole(supabase, 'admin')
  if (!user) throw new Error('No autorizado')

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/inventory/products')
}
