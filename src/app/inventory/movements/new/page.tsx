import { getProducts } from '@/features/inventory/queries'
import MovementForm from '@/features/movements/components/MovementForm'

export default async function NewMovementPage() {
  const products = await getProducts()

  return (
    <div className="p-4 lg:p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Registrar movimiento</h1>
        <p className="text-sm text-muted-foreground">Entrada o salida de material</p>
      </div>
      <MovementForm products={products} />
    </div>
  )
}
