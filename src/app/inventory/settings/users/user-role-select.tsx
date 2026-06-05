'use client'

import { useTransition } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { changeUserRole, removeUserRole } from '@/features/users/actions'
import { ROLE_LABELS } from '@/features/users/queries'
import type { UserRole } from '@/types'

const ROLES: UserRole[] = ['admin', 'nurse', 'purchasing', 'readonly']

interface Props {
  userId:      string
  currentRole: UserRole | null
}

export default function UserRoleSelect({ userId, currentRole }: Props) {
  const [pending, startTransition] = useTransition()

  function handleChange(value: string | null) {
    if (value === null) return
    startTransition(async () => {
      if (value === 'none') {
        await removeUserRole(userId)
      } else {
        await changeUserRole(userId, value as UserRole)
      }
    })
  }

  return (
    <Select
      value={currentRole ?? 'none'}
      onValueChange={handleChange}
      disabled={pending}
    >
      <SelectTrigger className="w-36 h-7 text-xs">
        <SelectValue placeholder="Sin rol" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">Sin rol</span>
        </SelectItem>
        {ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
