import { notFound } from 'next/navigation'
import { getSupplier } from '@/features/suppliers/queries'
import { getProducts } from '@/features/inventory/queries'
import { getAppCurrency } from '@/lib/currency'
import PurchaseOrderForm from '@/features/suppliers/components/PurchaseOrderForm'

interface Props { params: Promise<{ id: string }> }

export default async function NewOrderPage({ params }: Props) {
  const { id } = await params
  const [supplier, allProducts, currency] = await Promise.all([
    getSupplier(id),
    getProducts(),
    getAppCurrency(),
  ])
  if (!supplier) notFound()

  // Simplify products data for Client Component — only pass serializable fields
  const products = allProducts.map((p) => ({
    id:    p.id,
    name:  p.name,
    unit:  p.unit,
    price: p.price,
  }))

  return (
    <div className="p-4 lg:p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Nueva orden de compra</h1>
        <p className="text-sm text-muted-foreground">{supplier.name}</p>
      </div>
      <PurchaseOrderForm supplierId={id} products={products} currency={currency} />
    </div>
  )
}
