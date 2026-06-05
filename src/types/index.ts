// Convenience aliases derived from the auto-generated Database type.
// Import from '@/types' throughout the app — never import the raw names
// directly from '@/types/database.types' (those are inline types, not exports).
//
// Regenerate after schema changes:
//   npx supabase gen types typescript --project-id avslwtwcyriwlytfajye > src/types/database.types.ts

export type { Database, Json } from './database.types'
export type { Tables, TablesInsert, TablesUpdate, Enums } from './database.types'

import type { Tables, TablesInsert, Enums } from './database.types'

// ---------------------------------------------------------------------------
// Row types (read from DB)
// ---------------------------------------------------------------------------
export type Category      = Tables<'categories'>
export type Supplier      = Tables<'suppliers'>
export type Product       = Tables<'products'>
export type Procedure     = Tables<'procedures'>
export type Movement      = Tables<'movements'>
export type Alert         = Tables<'alerts'>
export type AlertLog      = Tables<'alert_logs'>
export type PurchaseOrder = Tables<'purchase_orders'>
export type UserRoleRow   = Tables<'user_roles'>
export type Settings      = Tables<'settings'>

// ---------------------------------------------------------------------------
// Insert types (write to DB)
// ---------------------------------------------------------------------------
export type CategoryInsert      = TablesInsert<'categories'>
export type SupplierInsert      = TablesInsert<'suppliers'>
export type ProductInsert       = TablesInsert<'products'>
export type ProcedureInsert     = TablesInsert<'procedures'>
export type MovementInsert      = TablesInsert<'movements'>
export type AlertInsert         = TablesInsert<'alerts'>
export type AlertLogInsert      = TablesInsert<'alert_logs'>
export type PurchaseOrderInsert = TablesInsert<'purchase_orders'>
export type UserRoleRowInsert   = TablesInsert<'user_roles'>

// ---------------------------------------------------------------------------
// Enum types
// ---------------------------------------------------------------------------
export type MovementType        = Enums<'movement_type'>
export type AlertStatus         = Enums<'alert_status'>
export type PurchaseOrderStatus = Enums<'purchase_order_status'>
export type SyncStatus          = Enums<'sync_status'>
export type UserRole            = Enums<'user_role'>
export type AlertLogType        = Enums<'alert_log_type'>
