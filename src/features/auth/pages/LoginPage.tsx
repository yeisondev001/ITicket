import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { EyeIcon, EyeOffIcon, LoaderCircleIcon, ShieldCheckIcon, TicketIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validarLogin, type CredencialesLogin, type ErroresLogin } from '../lib/validacionLogin'
import { useAuth } from '../context/useAuth'
import { rutaInicialPorRol } from '../lib/rutaInicial'

const PUNTOS = [
  'Reporta incidentes y sigue su estado en tiempo real.',
  'Clasificación asistida por IA y prioridad según ITIL.',
  'Control del SLA y escalamiento automático.',
]

export function LoginPage() {
    const ubicacion = useLocation()
    const { usuario, iniciarSesion, cargando } = useAuth()
    const [valores, setValores] = useState<CredencialesLogin>({ correo: '', contrasena: '' })
    const [errores, setErrores] = useState<ErroresLogin>({})
    const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
    const [enviando, setEnviando] = useState(false)
    const [verContrasena, setVerContrasena] = useState(false)

    if (cargando) {
        return (
            <div className="grid min-h-svh place-items-center" role="status">
                Comprobando sesión…
            </div>
        )
    }


  // Con sesión iniciada (o al entrar), vuelve a la página que pidió antes del
  // login o, si no hay, a la pantalla inicial de su rol.
  if (usuario) {
    const desde = (ubicacion.state as { desde?: string } | null)?.desde
    return <Navigate to={desde ?? rutaInicialPorRol(usuario.rol)} replace />
  }

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const encontrados = validarLogin(valores)
    setErrores(encontrados)
    setErrorGeneral(null)
    if (encontrados.correo || encontrados.contrasena) {
      document.getElementById(encontrados.correo ? 'correo' : 'contrasena')?.focus()
      return
    }
    setEnviando(true)
    try {
      await iniciarSesion(valores) // al guardar la sesión, la redirección de arriba se encarga
    } catch (e) {
      setErrorGeneral(e instanceof Error ? e.message : 'No se pudo iniciar sesión. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-blue-900 p-12 text-white lg:flex" aria-hidden="true">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/15">
            <TicketIcon className="size-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">ITicket</span>
        </div>
        <div className="max-w-md">
          <p className="text-3xl leading-tight font-semibold">Gestión de incidentes de TI, clara y a tiempo.</p>
          <ul className="mt-8 flex flex-col gap-3 text-blue-100">
            {PUNTOS.map((punto) => (
              <li key={punto} className="flex gap-2.5">
                <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-blue-300" />
                {punto}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-blue-200">Instituto Tecnológico de Las Américas · Proyecto final</p>
      </section>

      <main className="flex items-center justify-center p-4 sm:p-8">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TicketIcon className="size-4" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight">ITicket</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-muted-foreground">Entra con tu correo de la organización.</p>
          </div>

          <Card>
            <CardContent>
              <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="correo">Correo</Label>
                  <Input
                    id="correo"
                    type="email"
                    autoComplete="email"
                    value={valores.correo}
                    onChange={(e) => setValores({ ...valores, correo: e.target.value })}
                    placeholder="nombre@empresa.com"
                    aria-invalid={Boolean(errores.correo)}
                    aria-describedby={errores.correo ? 'correo-error' : undefined}
                    className="h-10"
                  />
                  {errores.correo && (
                    <p id="correo-error" className="text-xs font-medium text-destructive">
                      {errores.correo}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contrasena">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="contrasena"
                      type={verContrasena ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={valores.contrasena}
                      onChange={(e) => setValores({ ...valores, contrasena: e.target.value })}
                      aria-invalid={Boolean(errores.contrasena)}
                      aria-describedby={errores.contrasena ? 'contrasena-error' : undefined}
                      className="h-10 pr-11"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-1 -translate-y-1/2"
                      aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      aria-pressed={verContrasena}
                      onClick={() => setVerContrasena((v) => !v)}
                    >
                      {verContrasena ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
                    </Button>
                  </div>
                  {errores.contrasena && (
                    <p id="contrasena-error" className="text-xs font-medium text-destructive">
                      {errores.contrasena}
                    </p>
                  )}
                </div>

                {errorGeneral && (
                  <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {errorGeneral}
                  </p>
                )}

                <Button type="submit" size="lg" className="h-10" disabled={enviando}>
                  {enviando && <LoaderCircleIcon className="animate-spin" aria-hidden="true" />}
                  {enviando ? 'Entrando…' : 'Iniciar sesión'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
