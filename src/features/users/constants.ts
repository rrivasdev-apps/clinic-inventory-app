import type { UserRole } from '@/types'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin:      'Administrador',
  nurse:      'Enfermera',
  purchasing: 'Compras',
  readonly:   'Solo lectura',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin:      'Acceso total — configuración, usuarios, reportes',
  nurse:      'Registra entradas y salidas de materiales',
  purchasing: 'Alertas, proveedores y órdenes de compra',
  readonly:   'Solo consulta — sin modificaciones',
}
