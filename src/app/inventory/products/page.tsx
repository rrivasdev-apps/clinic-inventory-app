import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getProducts, getCategories } from '@/features/inventory/queries'
import { getStockStatus } from '@/features/inventory/utils'
import ProductsTable from './products-table'
import CategoriesDialog from './categories-dialog'

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string; status?: string }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { q, category, status } = await searchParams
  const [products, categories] = await Promise.all([getProducts(), getCategories()])

  const filtered = products.filter((p) => {
    const matchesSearch = !q ||
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      (p.code?.toLowerCase().includes(q.toLowerCase()) ?? false)

    const matchesCategory = !category || p.category_id === category

    const stockStatus = getStockStatus(p)
    const matchesStatus = !status || stockStatus === status

    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Productos</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {products.length} productos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CategoriesDialog categories={categories} />
          <Button size="sm" render={<Link href="/inventory/products/new" />}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo
          </Button>
        </div>
      </div>

      <ProductsTable
        products={filtered}
        categories={categories}
        currentSearch={q}
        currentCategory={category}
        currentStatus={status}
      />
    </div>
  )
}
