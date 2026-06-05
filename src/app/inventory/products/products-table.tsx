'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, Pencil, Trash2, QrCode } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import StockStatusBadge from '@/components/stock-status-badge'
import { deactivateProduct } from '@/features/inventory/actions'
import type { ProductWithRelations } from '@/features/inventory/queries'
import type { Category } from '@/types'

interface Props {
  products: ProductWithRelations[]
  categories: Category[]
  currentSearch?: string
  currentCategory?: string
  currentStatus?: string
}

const STATUS_OPTIONS = [
  { value: 'all',      label: 'Todos los estados' },
  { value: 'normal',   label: 'Normal' },
  { value: 'low',      label: 'Bajo' },
  { value: 'critical', label: 'Crítico' },
  { value: 'empty',    label: 'Agotado' },
]

export default function ProductsTable({
  products,
  categories,
  currentSearch,
  currentCategory,
  currentStatus,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string | null | undefined) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  return (
    <div className="space-y-3">
      {/* Search + filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o código…"
            defaultValue={currentSearch}
            className="pl-9"
            onChange={(e) => updateParam('q', e.target.value || undefined)}
          />
        </div>

        <Select
          defaultValue={currentCategory ?? undefined}
          onValueChange={(v) => updateParam('category', v)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          defaultValue={currentStatus ?? undefined}
          onValueChange={(v) => updateParam('status', v)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="hidden sm:table-cell">Categoría</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="hidden md:table-cell">Unidad</TableHead>
              <TableHead className="hidden lg:table-cell">Ubicación</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No se encontraron productos
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      {product.code && (
                        <p className="text-xs text-muted-foreground">{product.code}</p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="hidden sm:table-cell">
                    {product.category ? (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: product.category.color }}
                        />
                        {product.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium tabular-nums">
                        {product.stock_current}
                        <span className="text-xs text-muted-foreground ml-1">
                          / {product.stock_minimum} mín.
                        </span>
                      </p>
                      <StockStatusBadge
                        stockCurrent={product.stock_current}
                        stockMinimum={product.stock_minimum}
                      />
                    </div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {product.unit}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {product.location ?? '—'}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <SlidersHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acciones</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem render={<Link href={`/inventory/products/${product.id}/edit`} />}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem render={<Link href={`/inventory/movements/new?product=${product.code ?? product.id}`} />}>
                          <QrCode className="h-4 w-4 mr-2" />
                          Registrar movimiento
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deactivateProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Desactivar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
