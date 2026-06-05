import { z } from 'zod'

export const supplierSchema = z.object({
  name:         z.string().min(1, 'El nombre es requerido').max(200),
  contact_name: z.string().max(100).optional().or(z.literal('')),
  phone:        z.string().max(30).optional().or(z.literal('')),
  email:        z.string().email('Email inválido').optional().or(z.literal('')),
  address:      z.string().max(300).optional().or(z.literal('')),
  notes:        z.string().max(500).optional().or(z.literal('')),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>

export interface PurchaseOrderItem {
  product_id:   string
  product_name: string
  unit:         string
  quantity:     number
  unit_price:   number | null
}

export const purchaseOrderSchema = z.object({
  notes: z.string().max(500).optional().or(z.literal('')),
  // items come as JSON string from the hidden field
  items_json: z.string().min(2, 'Agrega al menos un producto'),
})
