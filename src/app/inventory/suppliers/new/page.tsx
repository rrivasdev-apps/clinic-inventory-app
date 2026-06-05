import SupplierForm from '@/features/suppliers/components/SupplierForm'

export default function NewSupplierPage() {
  return (
    <div className="p-4 lg:p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Nuevo proveedor</h1>
        <p className="text-sm text-muted-foreground">Completa los datos del proveedor</p>
      </div>
      <SupplierForm />
    </div>
  )
}
