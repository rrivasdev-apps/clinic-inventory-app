'use client'

import { useState, useActionState } from 'react'
import { Settings2, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCategory, deleteCategory } from '@/features/inventory/actions'
import type { Category } from '@/types'

interface Props {
  categories: Category[]
}

const PRESET_COLORS = ['#6b7280','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899']

export default function CategoriesDialog({ categories }: Props) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(createCategory, undefined)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Settings2 className="h-4 w-4 mr-1" />
        Categorías
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gestionar categorías</DialogTitle>
        </DialogHeader>

        {/* Existing categories */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aún no hay categorías
            </p>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium">{cat.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteCategory(cat.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Add new category */}
        <form action={formAction} className="space-y-3 border-t pt-4">
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="cat-name">Nueva categoría</Label>
            <Input
              id="cat-name"
              name="name"
              placeholder="Ej. Materiales de sutura"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <label key={color} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={color}
                    defaultChecked={color === '#6b7280'}
                    className="sr-only"
                  />
                  <span
                    className="block h-6 w-6 rounded-full border-2 border-transparent ring-offset-1 has-[:checked]:ring-2 has-[:checked]:ring-primary"
                    style={{ backgroundColor: color }}
                  />
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" size="sm" disabled={pending} className="w-full">
            <Plus className="h-4 w-4 mr-1" />
            {pending ? 'Creando…' : 'Agregar categoría'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
