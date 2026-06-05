import { createClient } from '@/lib/supabase/server'
import type { Movement, Product } from '@/types'

export type MovementWithProduct = Movement & {
  product: Pick<Product, 'id' | 'name' | 'unit'> | null
}

export async function getMovements(limit = 50): Promise<MovementWithProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('movements')
    .select('*, product:products(id, name, unit)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as MovementWithProduct[]
}

export async function getProductMovements(productId: string): Promise<MovementWithProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('movements')
    .select('*, product:products(id, name, unit)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)
  return (data ?? []) as MovementWithProduct[]
}
