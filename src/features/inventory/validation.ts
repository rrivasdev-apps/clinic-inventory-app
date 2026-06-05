import { z } from 'zod'

export const productSchema = z.object({
  name:          z.string().min(1, 'El nombre es requerido').max(200),
  code:          z.string().max(100).optional().or(z.literal('')),
  category_id:   z.string().uuid().optional().or(z.literal('')),
  unit:          z.string().min(1, 'La unidad es requerida').max(50),
  stock_minimum: z.coerce.number().min(0, 'Debe ser 0 o mayor'),
  stock_maximum: z.coerce.number().min(0).optional().nullable(),
  stock_current: z.coerce.number().min(0, 'Debe ser 0 o mayor'),
  location:      z.string().max(200).optional().or(z.literal('')),
  supplier_id:   z.string().uuid().optional().or(z.literal('')),
  price:         z.string().transform(v => v === '' ? null : parseFloat(v)).pipe(
    z.union([z.null(), z.number().min(0)])
  ).optional(),
  // Validate as ISO 8601 date (YYYY-MM-DD) to prevent corrupt DB values
  expiry_date:   z.string().date('Fecha inválida, usa formato YYYY-MM-DD').optional().or(z.literal('')),
  description:   z.string().max(1000).optional().or(z.literal('')),
})

// For updates: stock_current is not editable (managed via movements), so exclude it
export const productUpdateSchema = productSchema.omit({ stock_current: true })

export type ProductFormValues = z.infer<typeof productSchema>

export const categorySchema = z.object({
  name:        z.string().min(1, 'El nombre es requerido').max(100),
  color:       z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido').default('#6b7280'),
  description: z.string().max(300).optional().or(z.literal('')),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
