import Link from 'next/link'
import { Plus, Pencil, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getSuppliers } from '@/features/suppliers/queries'

export default async function SuppliersPage() {
  const suppliers = await getSuppliers()

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Proveedores</h1>
          <p className="text-sm text-muted-foreground">{suppliers.length} proveedores</p>
        </div>
        <Button size="sm" render={<Link href="/inventory/suppliers/new" />}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
          Aún no hay proveedores. Agrega uno para gestionar órdenes de compra.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <Link
              key={s.id}
              href={`/inventory/suppliers/${s.id}`}
              className="group rounded-xl border bg-card p-4 hover:border-primary/50 transition-colors space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{s.name}</p>
                  {s.contact_name && (
                    <p className="text-xs text-muted-foreground">{s.contact_name}</p>
                  )}
                </div>
                <Badge variant="outline" className={s.is_active ? 'text-green-700 border-green-200 bg-green-50' : 'text-muted-foreground'}>
                  {s.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="space-y-1">
                {s.phone && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" />{s.phone}
                  </p>
                )}
                {s.email && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                    <Mail className="h-3 w-3 shrink-0" />{s.email}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
