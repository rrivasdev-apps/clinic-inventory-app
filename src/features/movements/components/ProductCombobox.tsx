'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import StockStatusBadge from '@/components/stock-status-badge'
import { cn } from '@/lib/utils'
import type { ProductWithRelations } from '@/features/inventory/queries'

interface Props {
  products: ProductWithRelations[]
  value: string
  onChange: (product: ProductWithRelations | null) => void
}

export default function ProductCombobox({ products, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const selected = products.find((p) => p.id === value) ?? null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" className="w-full justify-between h-auto min-h-10 py-2" />}>
        {selected ? (
          <div className="flex flex-col items-start gap-0.5 text-left">
            <span className="font-medium text-sm">{selected.name}</span>
            <span className="text-xs text-muted-foreground">
              Stock: {selected.stock_current} {selected.unit}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar producto…
          </span>
        )}
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Nombre o código…" />
          <CommandList>
            <CommandEmpty>No se encontraron productos.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.code ?? ''}`}
                  onSelect={() => {
                    onChange(product.id === value ? null : product)
                    setOpen(false)
                  }}
                >
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      {product.code && (
                        <p className="text-xs text-muted-foreground">{product.code}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StockStatusBadge
                        stockCurrent={product.stock_current}
                        stockMinimum={product.stock_minimum}
                      />
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {product.stock_current}
                      </span>
                    </div>
                  </div>
                  <Check
                    className={cn('ml-2 h-4 w-4 shrink-0', value === product.id ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
