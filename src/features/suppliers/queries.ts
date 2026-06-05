import { createClient } from '@/lib/supabase/server'
import type { Supplier, PurchaseOrder, Movement, Product } from '@/types'

export type SupplierWithProducts = Supplier & { product_count: number }

export type PurchaseOrderWithItems = PurchaseOrder & {
  supplier: Pick<Supplier, 'id' | 'name'> | null
}

export type PurchaseMovement = Movement & {
  product: Pick<Product, 'id' | 'name' | 'unit'> | null
}

export async function getSuppliers(): Promise<Supplier[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()

  return data
}

export async function getSupplierPurchaseHistory(supplierId: string): Promise<PurchaseMovement[]> {
  const supabase = await createClient()

  // Get movements of type 'purchase' for products belonging to this supplier
  const { data } = await supabase
    .from('movements')
    .select('*, product:products!inner(id, name, unit, supplier_id)')
    .eq('type', 'purchase')
    .eq('product.supplier_id', supplierId)
    .order('created_at', { ascending: false })
    .limit(50)

  return (data ?? []) as PurchaseMovement[]
}

export async function getSupplierOrders(supplierId: string): Promise<PurchaseOrder[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getPurchaseOrder(orderId: string): Promise<PurchaseOrderWithItems | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('purchase_orders')
    .select('*, supplier:suppliers(id, name)')
    .eq('id', orderId)
    .single()

  return data as PurchaseOrderWithItems | null
}
