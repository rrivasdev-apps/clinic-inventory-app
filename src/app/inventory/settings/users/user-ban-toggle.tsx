'use client'

import { useTransition } from 'react'
import { setUserBanned } from '@/features/users/actions'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface Props {
  userId:   string
  isBanned: boolean
}

export default function UserBanToggle({ userId, isBanned }: Props) {
  const [pending, startTransition] = useTransition()

  function handleChange(checked: boolean) {
    startTransition(async () => {
      // checked = active (not banned), unchecked = disabled (banned)
      await setUserBanned(userId, !checked)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={!isBanned}
        onCheckedChange={handleChange}
        disabled={pending}
        id={`ban-${userId}`}
      />
      <Label htmlFor={`ban-${userId}`} className="text-xs text-muted-foreground cursor-pointer">
        {isBanned ? 'Inactivo' : 'Activo'}
      </Label>
    </div>
  )
}
