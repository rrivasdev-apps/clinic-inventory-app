import { createClient } from '@/lib/supabase/server'
import type { Category, Supplier, Product } from '@/types'

export type ProductWithRelations = Product & {
  category: Pick<Category, 'id' | 'name' | 'color'> | null
  supplier: Pick<Supplier, 'id' | 'name'> | null
}

export async function getProducts(): Promise<ProductWithRelations[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id, name, color), supplier:suppliers(id, name)')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as ProductWithRelations[]
}

export async function getProduct(id: string): Promise<ProductWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id, name, color), supplier:suppliers(id, name)')
    .eq('id', id)
    .single()

  if (error) return null
  return data as ProductWithRelations
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getSuppliers(): Promise<Pick<Supplier, 'id' | 'name'>[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}
