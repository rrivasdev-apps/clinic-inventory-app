'use client'

import { useSearchParams } from 'next/navigation'
import { useActionState, useState } from 'react'
import { signInWithPassword, signInWithMagicLink, type AuthActionState } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export default function LoginForm() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const [magicMode, setMagicMode] = useState(false)

  const [passwordState, passwordAction, passwordPending] = useActionState<AuthActionState, FormData>(
    signInWithPassword,
    undefined
  )
  const [magicState, magicAction, magicPending] = useActionState<AuthActionState, FormData>(
    signInWithMagicLink,
    undefined
  )

  const error = urlError === 'link_invalid'
    ? 'El enlace ha expirado o no es válido. Por favor intenta de nuevo.'
    : passwordState?.error ?? magicState?.error

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Inventario Clínica</CardTitle>
        <CardDescription>
          {magicMode ? 'Te enviamos un enlace a tu correo' : 'Ingresa con tu usuario y contraseña'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {magicState?.success && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {magicState.success}
          </p>
        )}

        {!magicMode ? (
          <form action={passwordAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="correo@clinica.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={passwordPending}>
              {passwordPending ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        ) : (
          <form action={magicAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="magic-email">Correo electrónico</Label>
              <Input
                id="magic-email"
                name="email"
                type="email"
                placeholder="correo@clinica.com"
                autoComplete="email"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={magicPending}>
              {magicPending ? 'Enviando…' : 'Enviar enlace de acceso'}
            </Button>
          </form>
        )}

        <Separator />

        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => setMagicMode(!magicMode)}
        >
          {magicMode ? 'Usar contraseña' : 'Acceder sin contraseña (link por correo)'}
        </Button>
      </CardContent>
    </Card>
  )
}
