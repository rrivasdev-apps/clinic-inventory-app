'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ArrowRightLeft,
  Bell, BarChart3, Truck, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

interface NavItem {
  href:       string
  label:      string
  icon:       React.ElementType
  allowedRoles?: UserRole[]  // undefined = all roles can see it
}

const navItems: NavItem[] = [
  { href: '/inventory/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/inventory/products',   label: 'Productos',   icon: Package },
  { href: '/inventory/movements',  label: 'Movimientos', icon: ArrowRightLeft },
  { href: '/inventory/alerts',     label: 'Alertas',     icon: Bell },
  { href: '/inventory/reports',    label: 'Reportes',    icon: BarChart3 },
  { href: '/inventory/suppliers',  label: 'Proveedores', icon: Truck,    allowedRoles: ['admin', 'purchasing'] },
  { href: '/inventory/settings',   label: 'Config',      icon: Settings, allowedRoles: ['admin'] },
]

interface Props {
  orientation: 'vertical' | 'horizontal'
  role:        UserRole | null
  activeAlertsCount: number
}

export default function InventoryNav({ orientation, role, activeAlertsCount }: Props) {
  const pathname = usePathname()

  const visible = navItems.filter(
    (item) => !item.allowedRoles || (role && item.allowedRoles.includes(role))
  )

  // Mobile: show first 5 visible items
  const mobileItems = visible.slice(0, 5)

  if (orientation === 'vertical') {
    return (
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {visible.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          const showAlertBadge = label === 'Alertas' && activeAlertsCount > 0
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {showAlertBadge && (
                <span className="ml-auto text-xs font-semibold text-orange-500">
                  (pend.)
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <div className="flex items-center justify-around px-2 py-1">
      {mobileItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        const showAlertBadge = label === 'Alertas' && activeAlertsCount > 0
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 transition-colors relative',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <div className="relative">
              <Icon className={cn('h-5 w-5', active && 'text-primary')} />
              {showAlertBadge && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  !
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </div>
  )
}
