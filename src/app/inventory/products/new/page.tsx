import { getCategories, getSuppliers } from '@/features/inventory/queries'
import ProductForm from '@/features/inventory/components/ProductForm'

export default async function NewProductPage() {
  const [categories, suppliers] = await Promise.all([getCategories(), getSuppliers()])

  return (
    <div className="p-4 lg:p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Nuevo producto</h1>
        <p className="text-sm text-muted-foreground">Completa los datos del producto</p>
      </div>
      <ProductForm categories={categories} suppliers={suppliers} />
    </div>
  )
}
