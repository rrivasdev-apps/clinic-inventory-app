import { z } from 'zod'

export const movementSchema = z.object({
  product_id:   z.string().uuid('Selecciona un producto'),
  type:         z.enum(['purchase', 'return', 'usage', 'expiry', 'loss', 'adjustment']),
  quantity:     z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  sign:         z.enum(['+', '-']).default('+'),
  notes:        z.string().max(500).optional().or(z.literal('')),
  procedure_id: z.string().uuid().optional().or(z.literal('')),
})

export type MovementFormValues = z.infer<typeof movementSchema>

// Separate constants make the direction of each type explicit
export const ENTRY_TYPES      = ['purchase', 'return'] as const
export const EXIT_TYPES        = ['usage', 'expiry', 'loss'] as const
export const ADJUSTMENT_TYPES  = ['adjustment'] as const   // bidirectional — sign chosen by user

export type EntryType      = typeof ENTRY_TYPES[number]
export type ExitType       = typeof EXIT_TYPES[number]
export type AdjustmentType = typeof ADJUSTMENT_TYPES[number]

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  purchase:   'Compra',
  return:     'Devolución',
  usage:      'Uso',
  expiry:     'Vencimiento',
  loss:       'Pérdida',
  adjustment: 'Ajuste',
}
