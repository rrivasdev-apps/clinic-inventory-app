'use client'

import { useState, useActionState } from 'react'
import { UserPlus } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { inviteUser } from '@/features/users/actions'
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/features/users/queries'
import type { UserRole } from '@/types'

const ROLES: UserRole[] = ['admin', 'nurse', 'purchasing', 'readonly']

export default function InviteUserDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(inviteUser, undefined)

  if (state?.success) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button size="sm" />}>
          <UserPlus className="h-4 w-4 mr-1" />
          Invitar usuario
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invitar usuario</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3">{state.success}</p>
          <Button variant="outline" onClick={() => { setOpen(false) }}>Cerrar</Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <UserPlus className="h-4 w-4 mr-1" />
        Invitar usuario
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Invitar usuario</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="invite-email">Correo electrónico</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="enfermera@clinica.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Rol</Label>
            <Select name="role" defaultValue="nurse">
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    <div>
                      <p className="font-medium">{ROLE_LABELS[role]}</p>
                      <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            El usuario recibirá un email con un enlace para crear su contraseña.
            Requiere que el email esté configurado en Supabase Authentication.
          </p>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Enviando invitación…' : 'Enviar invitación'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
