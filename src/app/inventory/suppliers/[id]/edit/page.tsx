import { notFound } from 'next/navigation'
import { getSupplier } from '@/features/suppliers/queries'
import SupplierForm from '@/features/suppliers/components/SupplierForm'

interface Props { params: Promise<{ id: string }> }

export default async function EditSupplierPage({ params }: Props) {
  const { id } = await params
  const supplier = await getSupplier(id)
  if (!supplier) notFound()

  return (
    <div className="p-4 lg:p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Editar proveedor</h1>
        <p className="text-sm text-muted-foreground">{supplier.name}</p>
      </div>
      <SupplierForm supplier={supplier} />
    </div>
  )
}
