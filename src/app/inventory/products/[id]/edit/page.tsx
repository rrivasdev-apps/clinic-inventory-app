import { notFound } from 'next/navigation'
import { getProduct, getCategories, getSuppliers } from '@/features/inventory/queries'
import ProductForm from '@/features/inventory/components/ProductForm'
import QrCode from '@/components/QrCode'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const [product, categories, suppliers] = await Promise.all([
    getProduct(id).catch(() => null),
    getCategories(),
    getSuppliers(),
  ])

  if (!product) notFound()

  const qrValue = product.code ?? product.id

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Editar producto</h1>
        <p className="text-sm text-muted-foreground">{product.name}</p>
      </div>

      <ProductForm categories={categories} suppliers={suppliers} product={product} />

      {/* QR label for printing */}
      <section className="rounded-xl border p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Etiqueta QR</h2>
          <p className="text-xs text-muted-foreground">
            Imprime y pega en el armario o envase para escaneado rápido.
          </p>
        </div>
        <QrCode
          value={qrValue}
          label={product.name}
          size={140}
        />
      </section>
    </div>
  )
}
