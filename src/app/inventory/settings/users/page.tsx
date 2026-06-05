import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { UserPlus, Shield, ShieldOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { requireAdminRole } from '@/lib/auth'
import { listUsers } from '@/features/users/queries'
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/features/users/constants'
import InviteUserDialog from './invite-dialog'
import UserRoleSelect from './user-role-select'
import UserBanToggle from './user-ban-toggle'
import type { UserRole } from '@/types'

const ROLE_BADGE: Record<UserRole, string> = {
  admin:      'bg-purple-100 text-purple-800 border-purple-200',
  nurse:      'bg-blue-100   text-blue-800   border-blue-200',
  purchasing: 'bg-green-100  text-green-800  border-green-200',
  readonly:   'bg-gray-100   text-gray-700   border-gray-200',
}

export default async function UsersPage() {
  await requireAdminRole()
  const users = await listUsers()

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} usuario{users.length !== 1 ? 's' : ''} registrados
          </p>
        </div>
        <InviteUserDialog />
      </div>

      {/* Role legend */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.entries(ROLE_DESCRIPTIONS) as [UserRole, string][]).map(([role, desc]) => (
          <div key={role} className="rounded-lg border bg-card px-3 py-2 space-y-0.5">
            <Badge variant="outline" className={`text-xs ${ROLE_BADGE[role]}`}>
              {ROLE_LABELS[role]}
            </Badge>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left text-xs text-muted-foreground uppercase tracking-wide">
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3 hidden md:table-cell">Último acceso</th>
              <th className="px-4 py-3 w-28">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className={user.is_banned ? 'opacity-50' : ''}>
                <td className="px-4 py-3">
                  <p className="font-medium truncate max-w-[200px]">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Desde {format(new Date(user.created_at), 'd MMM yyyy', { locale: es })}
                  </p>
                </td>

                <td className="px-4 py-3">
                  <UserRoleSelect userId={user.id} currentRole={user.role} />
                </td>

                <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                  {user.last_sign_in_at
                    ? format(new Date(user.last_sign_in_at), "d MMM, HH:mm", { locale: es })
                    : 'Nunca'}
                </td>

                <td className="px-4 py-3">
                  <UserBanToggle userId={user.id} isBanned={user.is_banned} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
